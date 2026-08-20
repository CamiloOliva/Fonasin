<?php

namespace Tests\Feature;

use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Application\Fpqrs\UseCases\SubmitFpqrsSubmission;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Fpqrs\Enums\FpqrsAuditAction;
use App\Domain\Fpqrs\Enums\FpqrsDeliveryStatus;
use App\Domain\Fpqrs\Enums\FpqrsSubmissionType;
use App\Mail\FpqrsSubmissionReceived;
use App\Models\FpqrsSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class FpqrsSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_fpqrs_submission_and_records_redacted_audit_event(): void
    {
        Mail::fake();
        config(['services.fpqrs.recipient_email' => 'attention@example.test']);

        $submission = app(SubmitFpqrsSubmission::class)(
            data: [
                'full_name' => 'Synthetic Citizen',
                'email' => 'Citizen@Example.test',
                'submission_type' => FpqrsSubmissionType::Petition,
                'message' => 'Synthetic message body.',
            ],
            ipHash: hash('sha256', '192.0.2.70'),
        );

        $this->assertSame('citizen@example.test', $submission->email);
        $this->assertSame(hash('sha256', 'citizen@example.test'), $submission->getAttribute('email_hash'));
        $this->assertSame(FpqrsSubmissionType::Petition->value, $submission->submission_type);
        $this->assertSame(FpqrsDeliveryStatus::Sent->value, $submission->delivery_status);
        $this->assertArrayNotHasKey('email', $submission->toArray());
        $this->assertArrayNotHasKey('message', $submission->toArray());
        $this->assertArrayNotHasKey('attachment_storage_key', $submission->toArray());

        $event = \App\Models\AuditEvent::query()
            ->where('module', AuditModule::Fpqrs->value)
            ->where('action', FpqrsAuditAction::SubmissionReceived->value)
            ->firstOrFail();

        $this->assertSame($submission->id, $event->subject_id);
        $this->assertFalse($event->metadata['has_attachment']);
        $this->assertStringNotContainsString('Synthetic message body', json_encode($event->metadata, JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('citizen@example.test', json_encode($event->metadata, JSON_THROW_ON_ERROR));

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Fpqrs->value,
            'action' => FpqrsAuditAction::DeliverySent->value,
            'subject_id' => $submission->id,
        ]);
        Mail::assertSent(FpqrsSubmissionReceived::class, function (FpqrsSubmissionReceived $mail): bool {
            return $mail->hasTo('attention@example.test');
        });
    }

    public function test_it_accepts_fpqrs_submission_over_http_with_private_attachment(): void
    {
        Mail::fake();
        config(['services.fpqrs.recipient_email' => 'attention@example.test']);
        Storage::fake('local');

        $response = $this->post('/fpqrs-submissions', [
            'full_name' => 'Synthetic Citizen',
            'email' => 'citizen@example.test',
            'submission_type' => FpqrsSubmissionType::Complaint->value,
            'message' => 'Synthetic complaint body.',
            'attachment' => UploadedFile::fake()->create('support.pdf', 32, 'application/pdf'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.submission_type', FpqrsSubmissionType::Complaint->value)
            ->assertJsonPath('data.delivery_status', FpqrsDeliveryStatus::Sent->value)
            ->assertJsonPath('data.has_attachment', true)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.message')
            ->assertJsonMissingPath('data.attachment_storage_key');

        $submission = FpqrsSubmission::query()->firstOrFail();

        Storage::disk('local')->assertExists($submission->getAttribute('attachment_storage_key'));
        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Fpqrs->value,
            'action' => FpqrsAuditAction::SubmissionReceived->value,
            'subject_id' => $submission->id,
        ]);
        Mail::assertSent(FpqrsSubmissionReceived::class);
    }

    public function test_it_rejects_invalid_fpqrs_attachment_type(): void
    {
        $this->post('/fpqrs-submissions', [
            'full_name' => 'Synthetic Citizen',
            'email' => 'citizen@example.test',
            'submission_type' => FpqrsSubmissionType::Complaint->value,
            'message' => 'Synthetic complaint body.',
            'attachment' => UploadedFile::fake()->create('script.exe', 1, 'application/x-msdownload'),
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_it_marks_submission_as_failed_when_delivery_fails(): void
    {
        $this->app->bind(DeliversFpqrsSubmissions::class, fn () => new class implements DeliversFpqrsSubmissions
        {
            public function deliver(FpqrsSubmission $submission): void
            {
                throw new RuntimeException('Synthetic mail failure.');
            }
        });

        $submission = app(SubmitFpqrsSubmission::class)(
            data: [
                'full_name' => 'Synthetic Citizen',
                'email' => 'citizen@example.test',
                'submission_type' => FpqrsSubmissionType::Suggestion,
                'message' => 'Synthetic suggestion body.',
            ],
        );

        $this->assertSame(FpqrsDeliveryStatus::Failed->value, $submission->delivery_status);
        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Fpqrs->value,
            'action' => FpqrsAuditAction::DeliveryFailed->value,
            'subject_id' => $submission->id,
        ]);
    }
}
