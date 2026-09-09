<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Portal\Enums\PortalAuditAction;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\CreditAccount;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class PortalAffiliationHttpTest extends TestCase
{
    use RefreshDatabase;
    use AffiliationSectionPayloads;

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

    public function test_inactive_associate_cannot_view_portal_affiliation(): void
    {
        $user = $this->userWithRole('associate');
        $this->createAssociate([
            'user_id' => $user->id,
            'status' => 'inactive',
        ]);

        $this->actingAs($user)
            ->getJson('/portal/affiliation')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El asociado no se encuentra activo.');
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
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonPath('data.documents.0.links.preview', fn (string $url): bool => str_starts_with($url, '/affiliation-applications/'))
            ->assertJsonMissingPath('data.documents.0.storage_key');
        $this->assertStringContainsString('context=portal', $response->json('data.documents.0.links.preview'));

        $documentTypes = collect($response->json('data.documents'))->pluck('document_type')->all();

        $this->assertEqualsCanonicalizing([
            ApplicationDocumentType::AffiliationSummary->value,
        ], $documentTypes);
    }

    public function test_portal_document_links_require_authenticated_owner_session(): void
    {
        $associate = $this->createAssociate();
        $application = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Enabled);
        $document = $this->createDocument($application, ApplicationDocumentType::AffiliationSummary);
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'affiliation-applications.documents.preview',
            now()->addMinutes(10),
            [
                'application' => $application,
                'document' => $document,
                'context' => 'portal',
            ],
            false,
        );

        $this->get($url)->assertForbidden();
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
            ->assertJsonPath('data.draft_access_token', fn (string $token): bool => strlen($token) === 64)
            ->assertJsonPath('data.links.read', fn (string $url): bool => str_starts_with($url, '/affiliation-applications/'));

        $draftId = $response->json('data.id');

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $draftId,
            'associate_id' => $associate->id,
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
        $this->assertSame(2, ApplicationSection::query()->where('application_id', $draftId)->count());
        $this->assertNotNull(AffiliationApplication::query()->findOrFail($draftId)->access_token_hash);
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
            ->assertJsonPath('data.id', $existingDraft->id)
            ->assertJsonPath('data.draft_access_token', fn (string $token): bool => strlen($token) === 64);

        $this->assertNotNull($existingDraft->refresh()->access_token_hash);

        $this->assertSame(
            1,
            $associate->affiliationApplications()->where('status', AffiliationApplicationStatus::Draft->value)->count(),
        );
    }

    public function test_associate_login_documents_and_update_draft_flow(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'email' => 'associate.flow@example.test',
            'password' => Hash::make('temporary-123'),
            'must_change_password' => true,
        ]);
        $role = Role::query()->firstOrCreate(['name' => 'associate']);
        $user->roles()->attach($role);

        $associate = $this->createAssociate(['user_id' => $user->id]);
        $this->createCredit($associate, [
            'credit_line' => 'Libre inversion',
            'current_balance' => 1200000,
        ]);
        $contributionAccount = $this->createContributionAccount($associate, [
            'permanent_savings_balance' => 300000,
            'voluntary_savings_balance' => 50000,
            'total_balance' => 350000,
        ]);
        $this->createContributionMovement($contributionAccount, [
            'reference' => 'APORTE-001',
            'balance_after' => 350000,
        ]);
        $application = $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Enabled);
        $this->saveCompletedSection($application, AffiliationApplicationStep::Personal);
        $this->saveCompletedSection($application, AffiliationApplicationStep::Employment);

        $document = $this->createDocument($application, ApplicationDocumentType::AffiliationSummary);
        Storage::disk('local')->put($document->storage_key, '%PDF-1.4 portal-test');

        $this->postJson('/login', [
            'email' => 'associate.flow@example.test',
            'password' => 'temporary-123',
        ])->assertOk()
            ->assertJsonPath('data.must_change_password', true)
            ->assertJsonPath('data.roles.0', 'associate');

        $this->getJson('/portal/account-statement')
            ->assertStatus(423)
            ->assertJsonPath('message', 'Password change is required before continuing.');

        $this->postJson('/auth/password', [
            'current_password' => 'temporary-123',
            'password' => 'NuevaClave123',
            'password_confirmation' => 'NuevaClave123',
        ])->assertOk()
            ->assertJsonPath('data.must_change_password', false);

        $this->getJson('/portal/account-statement?associate_id='.Str::uuid())
            ->assertOk()
            ->assertJsonPath('data.state', 'available')
            ->assertJsonPath('data.associate.id', $associate->id)
            ->assertJsonPath('data.credits.state', 'available')
            ->assertJsonPath('data.credits.total_current_balance', 1200000)
            ->assertJsonPath('data.credits.items.0.credit_line', 'Libre inversion')
            ->assertJsonPath('data.contributions.state', 'available')
            ->assertJsonPath('data.contributions.account.total_balance', '350000.00')
            ->assertJsonPath('data.contributions.movements.0.reference', 'APORTE-001');

        $portal = $this->getJson('/portal/affiliation')
            ->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonCount(1, 'data.documents')
            ->json('data');

        $this->get($portal['documents'][0]['links']['preview'])
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $draft = $this->postJson('/portal/affiliation/update-draft')
            ->assertCreated()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Draft->value)
            ->json('data');

        $readDraft = $this->getJson($draft['links']['read'], [
            'X-Affiliation-Draft-Token' => $draft['draft_access_token'],
        ])->assertOk()
            ->assertJsonPath('data.id', $draft['id'])
            ->json('data');

        $personalSection = collect($readDraft['sections'])
            ->firstWhere('section', AffiliationApplicationStep::Personal->value);

        $this->assertSame('Persona', $personalSection['data']['firstName'] ?? null);

        $this->postJson('/portal/affiliation/update-draft')
            ->assertCreated()
            ->assertJsonPath('data.id', $draft['id']);

        $this->postJson('/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out.');

        $this->getJson('/portal/account-statement')->assertUnauthorized();

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Portal->value,
            'actor_user_id' => $user->id,
            'action' => PortalAuditAction::AccountStatementViewed->value,
            'subject_type' => 'associate',
            'subject_id' => $associate->id,
        ]);
    }

    public function test_database_rejects_duplicate_active_draft_for_same_associate(): void
    {
        $associate = $this->createAssociate();
        $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Draft);

        $this->expectException(QueryException::class);

        $this->createAffiliationApplication($associate, AffiliationApplicationStatus::Draft);
    }

    public function test_inactive_associate_cannot_start_update_draft(): void
    {
        $user = $this->userWithRole('associate');
        $this->createAssociate([
            'user_id' => $user->id,
            'status' => 'inactive',
        ]);

        $this->actingAs($user)
            ->postJson('/portal/affiliation/update-draft')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El asociado no se encuentra activo.');
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

    private function createCredit(Associate $associate, array $overrides = []): CreditAccount
    {
        return CreditAccount::query()->create([
            'associate_id' => $associate->id,
            'credit_line' => 'Libre inversion',
            'initial_balance' => 1500000,
            'current_balance' => 1000000,
            'term_months' => 12,
            'interest_rate' => 1.2,
            'installment_amount' => 125000,
            'status' => 'active',
            'registered_by_user_id' => $associate->user_id,
            ...$overrides,
        ]);
    }

    private function createContributionAccount(Associate $associate, array $overrides = []): ContributionAccount
    {
        return ContributionAccount::query()->create([
            'associate_id' => $associate->id,
            'permanent_savings_balance' => 0,
            'voluntary_savings_balance' => 0,
            'total_balance' => 0,
            'status' => 'active',
            ...$overrides,
        ]);
    }

    private function createContributionMovement(ContributionAccount $account, array $overrides = []): ContributionMovement
    {
        return ContributionMovement::query()->create([
            'contribution_account_id' => $account->id,
            'associate_id' => $account->associate_id,
            'movement_type' => 'permanent_savings',
            'period' => '2026-09-01',
            'cut_off_date' => '2026-09-30',
            'amount' => 350000,
            'balance_after' => 350000,
            'status' => 'registered',
            'source' => 'manual',
            'reference' => 'APORTE-001',
            'recorded_at' => now(),
            ...$overrides,
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

    private function saveCompletedSection(
        AffiliationApplication $application,
        AffiliationApplicationStep $section,
    ): ApplicationSection {
        return app(SaveApplicationSection::class)(
            application: $application,
            section: $section,
            schemaVersion: 1,
            data: $this->validSectionPayload($section),
            completedAt: now(),
        );
    }
}
