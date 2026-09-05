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
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class AffiliationApplicationHttpTest extends TestCase
{
    use RefreshDatabase;
    use AffiliationSectionPayloads;

    public function test_it_creates_affiliation_draft_over_http(): void
    {
        $response = $this->postJson('/affiliation-applications');

        $response->assertCreated()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Draft->value)
            ->assertJsonPath('data.current_step', AffiliationApplicationStep::Personal->value)
            ->assertJsonPath('data.draft_access_token', fn (string $token): bool => strlen($token) === 64);

        $this->assertStringStartsWith('/affiliation-applications/', $response->json('data.links.sections.personal'));
        $this->assertStringStartsWith('/affiliation-applications/', $response->json('data.links.read'));
        $this->assertStringStartsWith('/affiliation-applications/', $response->json('data.links.documents'));
        $this->assertStringStartsWith('/affiliation-applications/', $response->json('data.links.consents'));
        $this->assertStringStartsWith('/affiliation-applications/', $response->json('data.links.submit'));

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $response->json('data.id'),
            'status' => AffiliationApplicationStatus::Draft->value,
        ]);
        $this->assertNotNull(
            AffiliationApplication::query()->findOrFail($response->json('data.id'))->access_token_hash
        );
    }

    public function test_it_stores_a_section_without_exposing_encrypted_payload_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);

        $response = $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Personal), [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
        ], $headers);

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
        $headers = $this->protectDraft($application);

        $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Documents), [
            'schema_version' => 1,
            'data' => ['document' => 'not-a-section'],
        ], $headers)->assertUnprocessable();
    }

    public function test_it_registers_document_without_exposing_storage_key_over_http(): void
    {
        Storage::fake('local');
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Documents->value,
        ]);
        $headers = $this->protectDraft($application);

        $response = $this->post($this->signedDocumentUrl($application), [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers]);

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
        $headers = $this->protectDraft($application);

        $response = $this->postJson($this->signedConsentUrl($application), [
            'consent_type' => ConsentType::DataProcessing->value,
            'policy_version' => '2026-01',
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('data.application_id', $application->id)
            ->assertJsonPath('data.consent_type', ConsentType::DataProcessing->value)
            ->assertJsonMissingPath('data.ip_hash');
    }

    public function test_it_reads_a_saved_draft_with_decrypted_sections_and_uploaded_documents(): void
    {
        Storage::fake('local');

        $draft = $this->postJson('/affiliation-applications')
            ->assertCreated()
            ->json('data');
        $headers = $this->draftHeaders($draft);

        $this->postJson($draft['links']['sections']['personal'], [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
            'completed' => true,
        ], $headers)->assertOk();

        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])->assertCreated();

        $this->postJson($draft['links']['consents'], [
            'consent_type' => ConsentType::DataProcessing->value,
            'policy_version' => '2026-01',
        ], $headers)->assertCreated();

        $this->getJson($draft['links']['read'], $headers)
            ->assertOk()
            ->assertJsonPath('data.id', $draft['id'])
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Draft->value)
            ->assertJsonPath('data.sections.0.section', AffiliationApplicationStep::Personal->value)
            ->assertJsonPath('data.sections.0.data.documentType', 'CC')
            ->assertJsonPath('data.documents.0.document_type', ApplicationDocumentType::Identity->value)
            ->assertJsonPath('data.documents.0.original_filename', 'identity.pdf')
            ->assertJsonPath('data.consents.0.consent_type', ConsentType::DataProcessing->value)
            ->assertJsonMissingPath('data.sections.0.data_encrypted')
            ->assertJsonMissingPath('data.documents.0.storage_key');
    }

    public function test_it_submits_a_complete_application_over_http(): void
    {
        Storage::fake('local');
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);
        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $response = $this->postJson($this->signedSubmitUrl($application), [
            'policy_version' => '2026-01',
        ], $headers);

        $response->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Submitted->value)
            ->assertJsonPath('data.current_step', AffiliationApplicationStep::Summary->value);

        $this->assertDatabaseHas('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::AffiliationSummary->value,
        ]);
        $this->assertDatabaseHas('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::PayrollAuthorization->value,
        ]);
    }

    public function test_it_does_not_read_a_submitted_application_as_a_recoverable_draft(): void
    {
        Storage::fake('local');
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);
        $this->completeSections($application);
        $this->uploadRequiredDocuments($application);
        $this->acceptRequiredConsents($application, '2026-01');

        $this->postJson($this->signedSubmitUrl($application), [
            'policy_version' => '2026-01',
        ], $headers)->assertOk();

        $this->getJson($this->signedReadUrl($application))
            ->assertConflict()
            ->assertJsonPath('message', 'La solicitud ya fue enviada o cerrada.');
    }

    public function test_it_returns_domain_error_when_submit_is_incomplete(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);

        $this->postJson($this->signedSubmitUrl($application), [
            'policy_version' => '2026-01',
        ], $headers)->assertUnprocessable();
    }

    public function test_it_rejects_public_application_mutations_without_signed_url(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);

        $this->postJson("/affiliation-applications/{$application->id}/sections/personal", [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
        ], $headers)->assertForbidden();
    }

    public function test_it_rejects_signed_draft_access_without_access_token(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $this->protectDraft($application);

        $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Personal), [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
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
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
        ])->assertForbidden();
    }

    public function test_it_rejects_completed_section_payloads_with_missing_required_fields_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['email'] = '';

        $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Personal), [
            'schema_version' => 1,
            'data' => $data,
            'completed' => true,
        ], $headers)
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'La seccion [personal] no se puede completar porque faltan campos obligatorios: correo electronico.']);
    }

    public function test_it_rejects_monthly_salary_outside_allowed_range_over_http(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Employment->value,
        ]);
        $headers = $this->protectDraft($application);
        $data = $this->validSectionPayload(AffiliationApplicationStep::Employment);
        $data['monthlySalary'] = '1000000';

        $this->postJson($this->signedSectionUrl($application, AffiliationApplicationStep::Employment), [
            'schema_version' => 1,
            'data' => $data,
            'completed' => true,
        ], $headers)
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'La seccion [employment] tiene un campo invalido [salario mensual]: debe estar entre $1.750.905 y $100.000.000.']);
    }

    public function test_it_completes_the_public_affiliation_flow_over_http(): void
    {
        Storage::fake('local');

        $draft = $this->postJson('/affiliation-applications')
            ->assertCreated()
            ->json('data');
        $headers = $this->draftHeaders($draft);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $this->postJson($draft['links']['sections'][$section->value], [
                'schema_version' => 1,
                'data' => $this->validSectionPayload($section),
                'completed' => true,
            ], $headers)->assertOk()
                ->assertJsonPath('data.section', $section->value);
        }

        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])
            ->assertCreated()
            ->assertJsonPath('data.document_type', ApplicationDocumentType::Identity->value);
        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::EmploymentCertificate->value,
            'file' => UploadedFile::fake()->create('employment-certificate.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])
            ->assertCreated()
            ->assertJsonPath('data.document_type', ApplicationDocumentType::EmploymentCertificate->value);

        foreach (ConsentType::requiredForSubmission() as $consentType) {
            $this->postJson($draft['links']['consents'], [
                'consent_type' => $consentType->value,
                'policy_version' => '2026-01',
            ], $headers)->assertCreated()
                ->assertJsonPath('data.consent_type', $consentType->value);
        }

        $this->postJson($draft['links']['submit'], [
            'policy_version' => '2026-01',
        ], $headers)
            ->assertOk()
            ->assertJsonPath('data.id', $draft['id'])
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Submitted->value)
            ->assertJsonPath('data.current_step', AffiliationApplicationStep::Summary->value)
            ->assertJsonPath('data.submitted_at', fn (?string $submittedAt): bool => $submittedAt !== null)
            ->assertJsonCount(2, 'data.generated_documents')
            ->assertJsonMissingPath('data.generated_documents.0.storage_key')
            ->assertJsonPath('data.generated_documents.0.links.download', fn (string $downloadUrl): bool => str_starts_with($downloadUrl, '/affiliation-applications/'))
            ->assertJsonPath('data.generated_documents.0.links.preview', fn (string $previewUrl): bool => str_starts_with($previewUrl, '/affiliation-applications/'));

        $application = AffiliationApplication::query()->findOrFail($draft['id']);

        $this->assertSame(5, $application->sections()->whereNotNull('completed_at')->count());
        $this->assertSame(4, $application->documents()->count());
        $this->assertNull($application->access_token_hash);
        $this->assertSame(2, $application->consentRecords()->count());
        $this->assertDatabaseHas('audit_events', [
            'subject_type' => 'affiliation_application',
            'subject_id' => $application->id,
            'action' => 'application.submitted',
        ]);

        $this->postJson($draft['links']['sections']['personal'], [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
        ], $headers)->assertStatus(409);

        $identityDocument = $application->documents()
            ->where('document_type', ApplicationDocumentType::Identity->value)
            ->firstOrFail();
        $identityPreviewUrl = URL::temporarySignedRoute(
            'affiliation-applications.documents.preview',
            now()->addMinutes(10),
            [
                'application' => $application,
                'document' => $identityDocument,
            ],
            false,
        );

        $this->get($identityPreviewUrl)->assertNotFound();

        foreach ($application->documents as $document) {
            Storage::disk('local')->assertExists($document->getAttribute('storage_key'));
        }
    }

    public function test_it_rejects_expired_public_draft_links(): void
    {
        $application = AffiliationApplication::query()->forceCreate([
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $headers = $this->protectDraft($application);
        $expiredUrl = URL::temporarySignedRoute(
            'affiliation-applications.sections.store',
            now()->subMinute(),
            [
                'application' => $application,
                'section' => AffiliationApplicationStep::Personal->value,
            ],
            false,
        );

        $this->postJson($expiredUrl, [
            'schema_version' => 1,
            'data' => $this->validSectionPayload(AffiliationApplicationStep::Personal),
        ], $headers)->assertForbidden();
    }

    public function test_it_downloads_generated_document_with_signed_url_and_audits_it(): void
    {
        Storage::fake('local');

        $draft = $this->postJson('/affiliation-applications')
            ->assertCreated()
            ->json('data');
        $headers = $this->draftHeaders($draft);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $this->postJson($draft['links']['sections'][$section->value], [
                'schema_version' => 1,
                'data' => $this->validSectionPayload($section),
                'completed' => true,
            ], $headers)->assertOk();
        }

        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])->assertCreated();
        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::EmploymentCertificate->value,
            'file' => UploadedFile::fake()->create('employment-certificate.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])->assertCreated();

        foreach (ConsentType::requiredForSubmission() as $consentType) {
            $this->postJson($draft['links']['consents'], [
                'consent_type' => $consentType->value,
                'policy_version' => '2026-01',
            ], $headers)->assertCreated();
        }

        $submitted = $this->postJson($draft['links']['submit'], [
            'policy_version' => '2026-01',
        ], $headers)
            ->assertOk()
            ->json('data');

        $downloadUrl = $submitted['generated_documents'][0]['links']['download'];

        $this->get($downloadUrl)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertDatabaseHas('audit_events', [
            'subject_type' => 'application_document',
            'subject_id' => $submitted['generated_documents'][0]['id'],
            'action' => 'document.downloaded',
        ]);
    }

    public function test_it_previews_generated_document_inline_with_signed_url_and_audits_it(): void
    {
        Storage::fake('local');

        $draft = $this->postJson('/affiliation-applications')
            ->assertCreated()
            ->json('data');
        $headers = $this->draftHeaders($draft);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $this->postJson($draft['links']['sections'][$section->value], [
                'schema_version' => 1,
                'data' => $this->validSectionPayload($section),
                'completed' => true,
            ], $headers)->assertOk();
        }

        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])->assertCreated();
        $this->post($draft['links']['documents'], [
            'document_type' => ApplicationDocumentType::EmploymentCertificate->value,
            'file' => UploadedFile::fake()->create('employment-certificate.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json', ...$headers])->assertCreated();

        foreach (ConsentType::requiredForSubmission() as $consentType) {
            $this->postJson($draft['links']['consents'], [
                'consent_type' => $consentType->value,
                'policy_version' => '2026-01',
            ], $headers)->assertCreated();
        }

        $submitted = $this->postJson($draft['links']['submit'], [
            'policy_version' => '2026-01',
        ], $headers)
            ->assertOk()
            ->json('data');

        $previewUrl = $submitted['generated_documents'][0]['links']['preview'];

        $response = $this->get($previewUrl)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringContainsString('inline', (string) $response->headers->get('content-disposition'));

        $this->assertDatabaseHas('audit_events', [
            'subject_type' => 'application_document',
            'subject_id' => $submitted['generated_documents'][0]['id'],
            'action' => 'document.viewed',
        ]);
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

    /**
     * @param array<string, mixed> $draft
     * @return array<string, string>
     */
    private function draftHeaders(array $draft): array
    {
        return ['X-Affiliation-Draft-Token' => (string) $draft['draft_access_token']];
    }

    /**
     * @return array<string, string>
     */
    private function protectDraft(AffiliationApplication $application, string $token = 'test-draft-token'): array
    {
        $application->forceFill([
            'access_token_hash' => hash('sha256', $token),
        ])->save();

        return ['X-Affiliation-Draft-Token' => $token];
    }

    private function signedSectionUrl(AffiliationApplication $application, AffiliationApplicationStep $section): string
    {
        return URL::temporarySignedRoute('affiliation-applications.sections.store', now()->addHour(), [
            'application' => $application,
            'section' => $section->value,
        ], false);
    }

    private function signedDocumentUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.documents.store', now()->addHour(), [
            'application' => $application,
        ], false);
    }

    private function signedReadUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.read', now()->addHour(), [
            'application' => $application,
        ], false);
    }

    private function signedConsentUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.consents.store', now()->addHour(), [
            'application' => $application,
        ], false);
    }

    private function signedSubmitUrl(AffiliationApplication $application): string
    {
        return URL::temporarySignedRoute('affiliation-applications.submit', now()->addHour(), [
            'application' => $application,
        ], false);
    }
}
