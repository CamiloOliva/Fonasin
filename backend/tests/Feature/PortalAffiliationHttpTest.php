<?php

namespace Tests\Feature;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PortalAffiliationHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_portal_affiliation(): void
    {
        $this->getJson('/portal/affiliation')->assertUnauthorized();
    }

    public function test_user_without_associate_gets_domain_error_on_portal_affiliation(): void
    {
        $user = $this->userWithRole('associate');

        $this->actingAs($user)
            ->getJson('/portal/affiliation')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El usuario autenticado no tiene un asociado vinculado.');
    }

    public function test_associate_without_enabled_application_gets_empty_affiliation_payload(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/portal/affiliation')
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $user->id,
            'action' => AffiliationAuditAction::ApplicationViewed->value,
            'subject_type' => 'associate',
            'subject_id' => $associate->id,
        ]);
    }

    public function test_associate_can_view_only_own_enabled_affiliation_generated_documents(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate(['user_id' => $user->id]);
        $application = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Enabled);
        $this->createDocument($application, ApplicationDocumentType::AffiliationSummary);
        $this->createDocument($application, ApplicationDocumentType::PayrollAuthorization);
        $this->createDocument($application, ApplicationDocumentType::Identity);
        $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Submitted);
        $this->createAffiliationApplication($this->createAssociate(), AffiliationApplicationStatus::Enabled);

        $response = $this->actingAs($user)->getJson('/portal/affiliation');

        $response->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Enabled->value)
            ->assertJsonCount(2, 'data.documents')
            ->assertJsonPath('data.documents.0.links.preview', fn (string $url): bool => str_starts_with($url, '/affiliation-applications/'))
            ->assertJsonMissingPath('data.documents.0.storage_key');

        $documentTypes = collect($response->json('data.documents'))->pluck('document_type')->all();

        $this->assertEqualsCanonicalizing([
            ApplicationDocumentType::AffiliationSummary->value,
            ApplicationDocumentType::PayrollAuthorization->value,
        ], $documentTypes);
    }

    public function test_associate_can_start_update_draft_from_enabled_affiliation(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate(['user_id' => $user->id]);
        $application = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Enabled);
        $this->createSection($application, AffiliationApplicationStep::Personal);
        $this->createSection($application, AffiliationApplicationStep::Employment);

        $response = $this->actingAs($user)->postJson('/portal/affiliation/update-draft');

        $response->assertCreated()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Draft->value)
            ->assertJsonPath('data.links.read', fn (string $url): bool => str_starts_with($url, '/affiliation-applications/'));

        $draftId = $response->json('data.id');

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $draftId,
            'associate_id' => $associate->id,
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $this->assertSame(2, ApplicationSection::query()->where('application_id', $draftId)->count());
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $user->id,
            'action' => AffiliationAuditAction::ApplicationUpdateDraftCreated->value,
            'subject_type' => 'affiliation_application',
            'subject_id' => $draftId,
        ]);
    }

    public function test_update_draft_reuses_existing_draft_for_associate(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate(['user_id' => $user->id]);
        $enabledApplication = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Enabled);
        $existingDraft = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Draft);
        $this->createSection($enabledApplication, AffiliationApplicationStep::Personal);

        $response = $this->actingAs($user)->postJson('/portal/affiliation/update-draft');

        $response->assertCreated()
            ->assertJsonPath('data.id', $existingDraft->id);

        $this->assertSame(
            1,
            $associate->affiliationApplications()->where('status', AffiliationApplicationStatus::Draft->value)->count(),
        );
    }

    /**
     * @param  array<string, string>  $overrides
     */
    private function createAssociate(array $overrides = []): Associate
    {
        $reference = (string) Str::uuid();

        return Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', $reference),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Test Person',
            'status' => 'active',
            ...$overrides,
        ]);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }

    private function createAffiliationApplication(
        Associate $associate,
        AffiliationApplicationStatus $status,
    ): AffiliationApplication {
        return AffiliationApplication::query()->create([
            'associate_id' => $associate->id,
            'status' => $status->value,
            'current_step' => AffiliationApplicationStep::Summary->value,
            'submitted_at' => now()->subDay(),
        ]);
    }

    private function createDocument(
        AffiliationApplication $application,
        ApplicationDocumentType $documentType,
    ): ApplicationDocument {
        return ApplicationDocument::query()->forceCreate([
            'application_id' => $application->id,
            'document_type' => $documentType->value,
            'original_filename' => "{$documentType->value}.pdf",
            'storage_key' => "affiliation-applications/{$application->id}/{$documentType->value}.pdf",
            'mime_type' => 'application/pdf',
            'byte_size' => 2048,
            'status' => ApplicationDocumentStatus::Uploaded->value,
            'uploaded_at' => now()->startOfSecond(),
        ]);
    }

    private function createSection(
        AffiliationApplication $application,
        AffiliationApplicationStep $section,
    ): ApplicationSection {
        return ApplicationSection::query()->forceCreate([
            'application_id' => $application->id,
            'section' => $section->value,
            'schema_version' => 1,
            'data_encrypted' => "encrypted-{$section->value}",
            'completed_at' => now()->startOfSecond(),
        ]);
    }
}
