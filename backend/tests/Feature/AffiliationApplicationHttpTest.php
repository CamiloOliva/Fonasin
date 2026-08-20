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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
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

        $response = $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Personal), [
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

        $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Documents), [
            'schema_version' => 1,
            'data' => ['document' => 'not-a-section'],
        ])->assertUnprocessable();
    }

    public function test_it_registers_document_without_exposing_storage_key_over_http(): void
    {
        Storage::fake('local');
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Documents->value,
        ]);

        $response = $this->post($this->signedDocumentUrl($application), [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.application_id', $application->id)
            ->assertJsonPath('data.document_type', ApplicationDocumentType::Identity->value)
            ->assertJsonMissingPath('data.storage_key');

        $this->assertDatabaseHas('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::Identity->value,
        ]);
        Storage::disk('local')->assertExists(
            $application->documents()->where('document_type', ApplicationDocumentType::Identity->value)->firstOrFail()->getAttribute('storage_key')
        );
    }

    public function test_it_accepts_consent_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Consents->value,
        ]);

        $response = $this->postJson($this->signedConsentUrl($application), [
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

        $response = $this->postJson($this->signedSubmitUrl($application), [
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

        $this->postJson($this->signedSubmitUrl($application), [
            'policy_version' => '2026-01',
        ])->assertUnprocessable();
    }

    public function test_it_rejects_public_application_mutations_without_signed_url(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);

        $this->postJson("/affiliation-applications/{$application->id}/sections/personal", [
            'schema_version' => 1,
            'data' => ['section' => 'personal'],
        ])->assertForbidden();
    }

    public function test_it_rejects_signed_url_reused_for_another_application(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $otherApplication = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $signedUrl = $this->signedSectionUrl($application, AffiliationApplicationStep::Personal);
        $tamperedUrl = str_replace($application->id, $otherApplication->id, $signedUrl);

        $this->postJson($tamperedUrl, [
            'schema_version' => 1,
            'data' => ['section' => 'personal'],
        ])->assertForbidden();
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

    private function signedSectionUrl(AffiliationApplication $application, AffiliationApplicationStep $section): string
    {
        return URL::temporarySignedRoute('affiliation-applications.sections.store', now()->addHour(), [
            'application' => $application,
            'section' => $section->value,
        ]);
    }

    private function signedDocumentUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.documents.store', now()->addHour(), [
            'application' => $application,
        ]);
    }

    private function signedConsentUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.consents.store', now()->addHour(), [
            'application' => $application,
        ]);
    }

    private function signedSubmitUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.submit', now()->addHour(), [
            'application' => $application,
        ]);
    }
}
