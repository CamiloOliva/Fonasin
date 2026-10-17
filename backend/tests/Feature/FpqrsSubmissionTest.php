<?php

namespace Tests\Feature;

use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Application\Fpqrs\UseCases\SubmitFpqrsSubmission;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Application\Storage\Contracts\ReadsPrivateFiles;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Fpqrs\Enums\FpqrsAuditAction;
use App\Domain\Fpqrs\Enums\FpqrsDeliveryStatus;
use App\Domain\Fpqrs\Enums\FpqrsSubmissionType;
use App\Infrastructure\Mail\LaravelFpqrsSubmissionMailer;
use App\Models\AuditEvent;
use App\Models\FpqrsSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Transport\ArrayTransport;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;
use Tests\TestCase;

class FpqrsSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mail.default' => 'array', 'services.fpqrs.recipient_email' => 'attention@example.test']);
        Storage::fake('local');
    }

    public function test_it_stores_fpqrs_submission_and_records_redacted_audit_event(): void
    {
        config(['services.fpqrs.recipient_email' => 'attention@example.test']);

        $submission = app(SubmitFpqrsSubmission::class)(
            data: [
                'full_name' => 'Synthetic Citizen',
                'email' => 'Citizen@Example.test',
                'submission_type' => FpqrsSubmissionType::Petition,
                'message' => 'Synthetic message body.',
            ],
            ipHash: $this->ipHash('192.0.2.70'),
        );

        $this->assertSame('citizen@example.test', $submission->email);
        $this->assertSame($this->emailHash('citizen@example.test'), $submission->getAttribute('email_hash'));
        $this->assertSame(FpqrsSubmissionType::Petition->value, $submission->submission_type);
        $this->assertSame(FpqrsDeliveryStatus::Sent->value, $submission->delivery_status);
        $this->assertArrayNotHasKey('email', $submission->toArray());
        $this->assertArrayNotHasKey('message', $submission->toArray());
        $this->assertArrayNotHasKey('attachment_storage_key', $submission->toArray());

        $event = AuditEvent::query()
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
        $mail = $this->sentEmail();
        $this->assertSame('attention@example.test', $mail->getTo()[0]->getAddress());
        $this->assertCount(0, $mail->getAttachments());
        $this->assertStringNotContainsString('No se adjunta', $mail->getHtmlBody());
    }

    public function test_it_accepts_fpqrs_submission_over_http_with_private_attachment(): void
    {
        config(['services.fpqrs.recipient_email' => 'attention@example.test']);
        Storage::fake('local');

        $response = $this->post('/fpqrs-submissions', [
            'full_name' => 'Synthetic Citizen',
            'email' => 'citizen@example.test',
            'submission_type' => FpqrsSubmissionType::Complaint->value,
            'message' => 'Synthetic complaint body.',
            'attachment' => UploadedFile::fake()->createWithContent('support.pdf', "%PDF-1.4\nSynthetic private support\n%%EOF"),
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
        $this->assertCount(1, $this->sentEmail()->getAttachments());
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

    public function test_fpqrs_submission_is_rate_limited(): void
    {
        config(['services.fpqrs.recipient_email' => 'attention@example.test']);

        $throttleKey = 'fpqrs-public|'.$this->ipHash('127.0.0.1').'|'.$this->emailHash('citizen@example.test');
        RateLimiter::clear($throttleKey);

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->post('/fpqrs-submissions', [
                'full_name' => 'Synthetic Citizen',
                'email' => 'citizen@example.test',
                'submission_type' => FpqrsSubmissionType::Petition->value,
                'message' => 'Synthetic message body.',
            ], ['Accept' => 'application/json'])->assertCreated();
        }

        $this->post('/fpqrs-submissions', [
            'full_name' => 'Synthetic Citizen',
            'email' => 'citizen@example.test',
            'submission_type' => FpqrsSubmissionType::Petition->value,
            'message' => 'Synthetic message body.',
        ], ['Accept' => 'application/json'])->assertStatus(429);

        RateLimiter::clear($throttleKey);
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

    #[DataProvider('attachmentCases')]
    public function test_email_contains_exact_private_attachment_bytes(string $name, string $mime, string $contents, string $extension): void
    {
        $response = $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->createWithContent($name, $contents),
        ], ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonPath('data.delivery_status', 'sent');
        $submission = FpqrsSubmission::query()->findOrFail($response->json('data.id'));
        $this->assertSame($contents, Storage::disk('local')->get($submission->attachment_storage_key));
        Storage::disk('public')->assertMissing($submission->attachment_storage_key);

        $mail = $this->sentEmail();
        $this->assertCount(1, $mail->getAttachments());
        $attachment = $mail->getAttachments()[0];
        $this->assertSame($contents, $attachment->getBody());
        $this->assertSame('adjunto-fpqrs.'.$extension, $attachment->getFilename());
        $this->assertSame($mime, $attachment->getMediaType().'/'.$attachment->getMediaSubtype());
        $this->assertSame('attachment', $attachment->getDisposition());
        // Inspect the MIME that a transport receives, not just a Mail::fake assertion.
        $wire = $mail->toString();
        $this->assertStringContainsString('multipart/mixed', $wire);
        $this->assertStringContainsString(rtrim(chunk_split(base64_encode($contents), 76, "\r\n")), $wire);
        $this->assertStringNotContainsString($submission->attachment_storage_key, $wire);
        $this->assertStringNotContainsString('No se adjunta', $mail->getHtmlBody());
        $this->assertStringContainsString('se incluye adjunto', $mail->getHtmlBody());
    }

    public static function attachmentCases(): array
    {
        return [
            'PDF' => ['datos privados.pdf', 'application/pdf', "%PDF-1.4\nSynthetic attachment\n%%EOF", 'pdf'],
            'PNG' => ['datos privados.png', 'image/png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9l8AAAAASUVORK5CYII='), 'png'],
            'JPEG' => ['datos privados.jpg', 'image/jpeg', base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdAAr/2Q=='), 'jpg'],
        ];
    }

    #[DataProvider('unreadableCases')]
    public function test_attachment_read_failure_is_not_a_successful_delivery(string $mode): void
    {
        $reader = new class($mode) implements ReadsPrivateFiles
        {
            public mixed $stream = null;

            public function __construct(private string $mode) {}

            public function open(string $storageKey): mixed
            {
                if ($this->mode === 'missing') {
                    return null;
                }
                if ($this->mode === 'unreadable') {
                    throw new RuntimeException('Synthetic private read failure.');
                }
                $this->stream = fopen('php://temp', 'w+');
                fwrite($this->stream, match ($this->mode) {
                    'truncated' => '%PDF',
                    'oversized' => str_repeat('x', 5 * 1024 * 1024 + 1),
                    default => '',
                });
                rewind($this->stream);

                return $this->stream;
            }
        };
        $this->app->instance(ReadsPrivateFiles::class, $reader);
        $response = $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->createWithContent('support.pdf', "%PDF-1.4\nSynthetic\n%%EOF"),
        ], ['Accept' => 'application/json']);
        $response->assertStatus(502)->assertJsonPath('data.delivery_status', 'failed');
        $this->assertFailedDelivery($response->json('data.id'));
        $this->assertCount(0, Mail::mailer()->getSymfonyTransport()->messages());
        $this->assertFalse(is_resource($reader->stream));
        $submission = FpqrsSubmission::query()->findOrFail($response->json('data.id'));
        Storage::disk('local')->assertExists($submission->attachment_storage_key);
        $response->assertJsonMissingPath('data.attachment_storage_key');
    }

    public static function unreadableCases(): array
    {
        return array_map(fn ($mode) => [$mode], ['missing', 'unreadable', 'truncated', 'empty', 'oversized']);
    }

    #[DataProvider('transportFailures')]
    public function test_transport_failure_or_suppression_never_reports_delivery_success(string $mode): void
    {
        if ($mode === 'suppressed') {
            Event::listen(MessageSending::class, fn () => false);
        } else {
            Mail::mailer()->setSymfonyTransport(new class($mode) implements TransportInterface
            {
                public function __construct(private string $mode) {}

                public function send(RawMessage $message, ?Envelope $envelope = null): ?SentMessage
                {
                    if ($this->mode === 'throw') {
                        throw new RuntimeException('Synthetic SMTP failure.');
                    }

                    return null;
                }

                public function __toString(): string
                {
                    return 'synthetic-failure';
                }
            });
        }

        $response = $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->createWithContent('support.pdf', "%PDF-1.4\nSynthetic\n%%EOF"),
        ], ['Accept' => 'application/json']);
        $response->assertStatus(502)->assertJsonPath('data.delivery_status', 'failed');
        $this->assertFailedDelivery($response->json('data.id'));
        $this->assertStringNotContainsString('SMTP', $response->getContent());
        $submission = FpqrsSubmission::query()->findOrFail($response->json('data.id'));
        Storage::disk('local')->assertExists($submission->attachment_storage_key);
    }

    public static function transportFailures(): array
    {
        return [['throw'], ['null'], ['suppressed']];
    }

    public function test_http_submission_without_attachment_is_delivered_without_mime_attachments(): void
    {
        $this->postJson('/fpqrs-submissions', $this->requestData())
            ->assertCreated()->assertJsonPath('data.delivery_status', 'sent')
            ->assertJsonPath('data.has_attachment', false);
        $this->assertCount(0, $this->sentEmail()->getAttachments());
    }

    public function test_oversized_attachment_is_rejected_before_mail_or_record_creation(): void
    {
        $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->create('support.pdf', 5121, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('attachment');
        $this->assertDatabaseCount('fpqrs_submissions', 0);
        $this->assertCount(0, Mail::mailer()->getSymfonyTransport()->messages());
    }

    public function test_missing_recipient_is_a_delivery_failure_not_success(): void
    {
        config(['services.fpqrs.recipient_email' => '']);
        $response = $this->postJson('/fpqrs-submissions', $this->requestData());
        $response->assertStatus(502)->assertJsonPath('data.delivery_status', 'failed');
        $this->assertFailedDelivery($response->json('data.id'));
    }

    public function test_storage_write_failure_does_not_report_success_or_send_mail(): void
    {
        config(['app.debug' => false]);
        $this->app->instance(StoresPrivateFiles::class, new class implements StoresPrivateFiles
        {
            public function put(string $storageKey, string $contents): void
            {
                throw new RuntimeException('Synthetic private storage failure.');
            }
        });
        $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->createWithContent('support.pdf', "%PDF-1.4\nSynthetic\n%%EOF"),
        ], ['Accept' => 'application/json'])->assertStatus(500);
        $this->assertDatabaseCount('fpqrs_submissions', 0);
        $this->assertCount(0, Mail::mailer()->getSymfonyTransport()->messages());
    }

    #[DataProvider('invalidMetadata')]
    public function test_mailer_rejects_unsafe_attachment_metadata(string $field, string $value): void
    {
        $this->post('/fpqrs-submissions', $this->requestData() + [
            'attachment' => UploadedFile::fake()->createWithContent('support.pdf', "%PDF-1.4\nSynthetic\n%%EOF"),
        ], ['Accept' => 'application/json'])->assertCreated();
        Mail::mailer()->getSymfonyTransport()->flush();
        $submission = FpqrsSubmission::query()->firstOrFail();
        $submission->setAttribute($field, str_replace('{id}', $submission->id, $value));
        try {
            app(LaravelFpqrsSubmissionMailer::class)->deliver($submission);
            $this->fail('Unsafe attachment metadata must prevent delivery.');
        } catch (RuntimeException) {
            $this->assertCount(0, Mail::mailer()->getSymfonyTransport()->messages());
        }
    }

    public static function invalidMetadata(): array
    {
        return [
            ['attachment_mime_type', 'text/html'],
            ['attachment_storage_key', 'associates/unrelated/identity.pdf'],
            ['attachment_storage_key', 'fpqrs-submissions/{id}/attachments/../unrelated.pdf'],
            ['attachment_storage_key', 'fpqrs-submissions/{id}/attachments/..\\unrelated.pdf'],
        ];
    }

    #[DataProvider('nonDeliveryMailers')]
    public function test_production_rejects_non_delivery_transports_including_fallbacks(string $mailer): void
    {
        $transport = Mail::mailer()->getSymfonyTransport();
        config([
            'mail.default' => $mailer,
            'mail.mailers.nested' => ['transport' => 'roundrobin', 'mailers' => ['failover']],
            'mail.mailers.cyclic' => ['transport' => 'failover', 'mailers' => ['cyclic']],
        ]);
        $this->app->instance('env', 'production');
        $response = $this->postJson('/fpqrs-submissions', $this->requestData());
        $response->assertStatus(502)->assertJsonPath('data.delivery_status', 'failed');
        $this->assertFailedDelivery($response->json('data.id'));
        $this->assertCount(0, $transport->messages());
    }

    public static function nonDeliveryMailers(): array
    {
        return [['log'], ['array'], ['failover'], ['nested'], ['cyclic']];
    }

    #[DataProvider('nonDeliveryUrls')]
    public function test_production_resolves_url_overrides_before_authorizing_delivery(string $url, bool $nested): void
    {
        $transport = Mail::mailer()->getSymfonyTransport();
        config([
            'mail.default' => $nested ? 'outer' : 'smtp',
            'mail.mailers.smtp' => ['transport' => 'smtp', 'url' => $url],
            'mail.mailers.outer' => ['transport' => 'roundrobin', 'mailers' => ['inner']],
            'mail.mailers.inner' => ['transport' => 'failover', 'mailers' => ['smtp']],
        ]);
        Mail::purge('smtp');
        $this->app->instance('env', 'production');
        $response = $this->postJson('/fpqrs-submissions', $this->requestData());
        $response->assertStatus(502)->assertJsonPath('data.delivery_status', 'failed');
        $this->assertFailedDelivery($response->json('data.id'));
        $this->assertCount(0, $transport->messages());
    }

    public static function nonDeliveryUrls(): array
    {
        return [
            ['array://synthetic', false],
            ['log://synthetic', false],
            ['smtp://synthetic?driver=array', false],
            ['smtp://synthetic?driver=log', false],
            ['array://synthetic', true],
            ['log://synthetic', true],
            ['smtp://synthetic?driver=array', true],
            ['smtp://synthetic?driver=log', true],
        ];
    }

    public function test_production_allows_real_smtp_url_with_a_test_transport(): void
    {
        config([
            'mail.default' => 'smtp',
            // The effective transport is smtp, not the raw array value.
            'mail.mailers.smtp' => ['transport' => 'array', 'url' => 'smtp://127.0.0.1:1'],
        ]);
        Mail::purge('smtp');
        Mail::mailer('smtp')->setSymfonyTransport(new ArrayTransport);
        $this->app->instance('env', 'production');
        $this->postJson('/fpqrs-submissions', $this->requestData())
            ->assertCreated()->assertJsonPath('data.delivery_status', 'sent');
        $this->assertCount(0, $this->sentEmail()->getAttachments());
    }

    public function test_production_accepts_delivery_configuration_with_a_test_transport(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp' => ['transport' => 'smtp', 'host' => '127.0.0.1', 'port' => 1],
        ]);
        // Exercise the production guard without opening a network connection.
        Mail::mailer('smtp')->setSymfonyTransport(new ArrayTransport);
        $this->app->instance('env', 'production');
        $this->postJson('/fpqrs-submissions', $this->requestData())
            ->assertCreated()->assertJsonPath('data.delivery_status', 'sent');
        $this->assertCount(0, $this->sentEmail()->getAttachments());
    }

    private function assertFailedDelivery(string $id): void
    {
        $this->assertDatabaseHas('audit_events', ['subject_id' => $id, 'action' => FpqrsAuditAction::DeliveryFailed->value]);
        $this->assertDatabaseMissing('audit_events', ['subject_id' => $id, 'action' => FpqrsAuditAction::DeliverySent->value]);
        $event = AuditEvent::query()->where('subject_id', $id)->where('action', FpqrsAuditAction::DeliveryFailed->value)->firstOrFail();
        $this->assertSame(['delivery_status', 'error_class'], array_keys($event->metadata));
    }

    private function requestData(): array
    {
        return [
            'full_name' => 'Synthetic Citizen', 'email' => 'citizen@example.test',
            'submission_type' => FpqrsSubmissionType::Petition->value, 'message' => 'Synthetic message.',
        ];
    }

    private function sentEmail(): Email
    {
        $transport = Mail::mailer()->getSymfonyTransport();
        $this->assertInstanceOf(ArrayTransport::class, $transport);
        $this->assertCount(1, $transport->messages());
        $message = $transport->messages()->last()->getOriginalMessage();
        $this->assertInstanceOf(Email::class, $message);

        return $message;
    }

    private function emailHash(string $email): string
    {
        return app(HashesSensitiveData::class)->email($email);
    }

    private function ipHash(string $ip): string
    {
        return app(HashesSensitiveData::class)->ip($ip);
    }
}
