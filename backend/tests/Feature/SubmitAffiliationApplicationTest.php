<?php

namespace Tests\Feature;

use App\Application\Affiliation\Exceptions\CannotSubmitAffiliationApplication;
use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Affiliation\UseCases\SubmitAffiliationApplication;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class SubmitAffiliationApplicationTest extends TestCase
{
    use RefreshDatabase;
    use AffiliationSectionPayloads;

    public function test_it_submits_a_complete_application_and_records_audit_event(): void
    {
        Storage::fake('local');
        $application = app(CreateAffiliationDraft::class)();
        $actor = User::factory()->create();
        $submittedAt = now('UTC')->startOfSecond();
        $correlationId = (string) Str::uuid();
        $ipHash = hash('sha256', '192.0.2.30');

        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $submitted = app(SubmitAffiliationApplication::class)(
            application: $application,
            policyVersion: '2026-01',
            actor: $actor,
            correlationId: $correlationId,
            ipHash: $ipHash,
            submittedAt: $submittedAt,
        );

        $this->assertSame(AffiliationApplicationStatus::Submitted->value, $submitted->status);
        $this->assertSame(AffiliationApplicationStep::Summary->value, $submitted->current_step);
        $this->assertSame($submittedAt->format('Y-m-d H:i:s'), $submitted->submitted_at->format('Y-m-d H:i:s'));

        $generatedDocuments = $application->documents()
            ->whereIn('document_type', [
                ApplicationDocumentType::AffiliationSummary->value,
                ApplicationDocumentType::PayrollAuthorization->value,
            ])
            ->get();

        $this->assertCount(2, $generatedDocuments);

        foreach ($generatedDocuments as $document) {
            Storage::disk('local')->assertExists($document->storage_key);
            $this->assertStringStartsWith('%PDF', Storage::disk('local')->get($document->storage_key));
        }

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $actor->id,
            'module' => AuditModule::Affiliation->value,
            'action' => AffiliationAuditAction::ApplicationSubmitted->value,
            'subject_type' => 'affiliation_application',
            'subject_id' => $application->id,
            'correlation_id' => $correlationId,
            'ip_hash' => $ipHash,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Affiliation->value,
            'action' => AffiliationAuditAction::DocumentGenerated->value,
            'subject_type' => 'application_document',
            'correlation_id' => $correlationId,
            'ip_hash' => $ipHash,
        ]);
    }

    public function test_it_rejects_submission_when_required_sections_are_missing(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $this->expectException(CannotSubmitAffiliationApplication::class);

        app(SubmitAffiliationApplication::class)($application, '2026-01');
    }

    public function test_it_rejects_submission_when_required_consents_are_missing(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);

        $this->expectException(CannotSubmitAffiliationApplication::class);

        app(SubmitAffiliationApplication::class)($application, '2026-01');
    }

    public function test_it_rejects_submission_when_required_documents_are_missing(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $this->completeSections($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $this->expectException(CannotSubmitAffiliationApplication::class);

        app(SubmitAffiliationApplication::class)($application, '2026-01');
    }

    public function test_it_rejects_submission_from_an_invalid_status(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $application->forceFill([
            'status' => AffiliationApplicationStatus::Submitted->value,
        ])->save();
        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $this->expectException(CannotSubmitAffiliationApplication::class);

        app(SubmitAffiliationApplication::class)($application, '2026-01');
    }

    private function completeSections(AffiliationApplication $application): void
    {
        $saveSection = app(SaveApplicationSection::class);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $saveSection(
                application: $application,
                section: $section,
                schemaVersion: 1,
                data: $this->validSectionPayload($section),
                completedAt: now()->startOfSecond(),
            );
        }
    }

    private function acceptRequiredConsents(AffiliationApplication $application, string $policyVersion): void
    {
        $acceptConsent = app(AcceptApplicationConsent::class);

        foreach (ConsentType::requiredForSubmission() as $consentType) {
            $acceptConsent($application, $consentType, $policyVersion);
        }
    }

    private function uploadRequiredDocuments(AffiliationApplication $application): void
    {
        $registerDocument = app(RegisterApplicationDocument::class);

        foreach (ApplicationDocumentType::requiredForSubmission() as $documentType) {
            $registerDocument(
                application: $application,
                documentType: $documentType,
                originalFilename: "{$documentType->value}.pdf",
                mimeType: 'application/pdf',
                byteSize: 2048,
            );
        }
    }
}
