<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Models\AffiliationApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliationApplicationHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_affiliation_draft_over_http(): void
    {
        $response = $this->postJson('/affiliation-applications');

        $response->assertCreated()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Draft->value)
            ->assertJsonPath('data.current_step', AffiliationApplicationStep::Personal->value);

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $response->json('data.id'),
            'status' => AffiliationApplicationStatus::Draft->value,
        ]);
    }

    public function test_it_stores_a_section_without_exposing_encrypted_payload_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);

        $response = $this->postJson("/affiliation-applications/{$application->id}/sections/personal", [
            'schema_version' => 1,
            'data' => [
                'document_number' => '123456789',
                'full_name' => 'Synthetic Test Person',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.application_id', $application->id)
            ->assertJsonPath('data.section', AffiliationApplicationStep::Personal->value)
            ->assertJsonMissingPath('data.data_encrypted');

        $this->assertDatabaseHas('application_sections', [
            'application_id' => $application->id,
            'section' => AffiliationApplicationStep::Personal->value,
        ]);
    }

    public function test_it_rejects_non_form_section_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);

        $this->postJson("/affiliation-applications/{$application->id}/sections/documents", [
            'schema_version' => 1,
            'data' => ['document' => 'not-a-section'],
        ])->assertUnprocessable();
    }

    public function test_it_registers_document_without_exposing_storage_key_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Documents->value,
        ]);

        $response = $this->postJson("/affiliation-applications/{$application->id}/documents", [
            'document_type' => ApplicationDocumentType::Identity->value,
            'original_filename' => 'identity.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 2048,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.application_id', $application->id)
            ->assertJsonPath('data.document_type', ApplicationDocumentType::Identity->value)
            ->assertJsonMissingPath('data.storage_key');

        $this->assertDatabaseHas('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::Identity->value,
        ]);
    }

    public function test_it_accepts_consent_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Consents->value,
        ]);

        $response = $this->postJson("/affiliation-applications/{$application->id}/consents", [
            'consent_type' => ConsentType::DataProcessing->value,
            'policy_version' => '2026-01',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.application_id', $application->id)
            ->assertJsonPath('data.consent_type', ConsentType::DataProcessing->value)
            ->assertJsonMissingPath('data.ip_hash');
    }

    public function test_it_submits_a_complete_application_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $response = $this->postJson("/affiliation-applications/{$application->id}/submit", [
            'policy_version' => '2026-01',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Submitted->value)
            ->assertJsonPath('data.current_step', AffiliationApplicationStep::Summary->value);
    }

    public function test_it_returns_domain_error_when_submit_is_incomplete(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);

        $this->postJson("/affiliation-applications/{$application->id}/submit", [
            'policy_version' => '2026-01',
        ])->assertUnprocessable();
    }

    private function completeSections(AffiliationApplication $application): void
    {
        $saveSection = app(SaveApplicationSection::class);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $saveSection(
                application: $application,
                section: $section,
                schemaVersion: 1,
                data: ['section' => $section->value],
                completedAt: now()->startOfSecond(),
            );
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

    private function acceptRequiredConsents(AffiliationApplication $application, string $policyVersion): void
    {
        $acceptConsent = app(AcceptApplicationConsent::class);

        foreach (ConsentType::requiredForSubmission() as $consentType) {
            $acceptConsent($application, $consentType, $policyVersion);
        }
    }
}
