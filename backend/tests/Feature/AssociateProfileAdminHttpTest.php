<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationPurpose;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Portal\Enums\PortalAuditAction;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\CreditAccount;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Shuchkin\SimpleXLSX;
use Tests\TestCase;

class AssociateProfileAdminHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_search_view_and_export_sensitive_associate_profiles(): void
    {
        $associate = $this->associateWithProfile();
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');

        $this->postJson('/admin/associates/profile/search', ['document_number' => '1099001122'])
            ->assertUnauthorized();

        $this->actingAs($reviewer)
            ->postJson('/admin/associates/profile/search', ['document_number' => '1099001122'])
            ->assertForbidden();
        $this->actingAs($reviewer)
            ->getJson("/admin/associates/{$associate->id}/profile")
            ->assertForbidden();
        $this->actingAs($reviewer)
            ->get("/admin/associates/{$associate->id}/profile/export")
            ->assertForbidden();
    }

    public function test_admin_searches_by_document_and_receives_the_consolidated_profile(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $associate = $this->associateWithProfile($admin);

        $this->actingAs($admin)
            ->postJson('/admin/associates/profile/search', ['document_number' => ' 1099001122 '])
            ->assertOk()
            ->assertJsonPath('data.associate.id', $associate->id)
            ->assertJsonPath('data.associate.document_number', '1099001122')
            ->assertJsonPath('data.form.state', 'available')
            ->assertJsonPath('data.form.application.purpose', AffiliationApplicationPurpose::InitialAffiliation->value)
            ->assertJsonPath('data.form.application.sections.0.data.firstName', 'Persona')
            ->assertJsonPath('data.credits.state', 'available')
            ->assertJsonPath('data.credits.items.0.promissory_note_number', 'PAG-001')
            ->assertJsonPath('data.contributions.account.contribution_balance', '200000.00')
            ->assertJsonPath('data.contributions.movements.0.reference', 'APORTE-2026-09')
            ->assertJsonMissingPath('data.associate.document_number_hash')
            ->assertJsonMissingPath('data.credits.items.0.promissory_note_number_hash')
            ->assertJsonMissingPath('data.contributions.movements.0.source_row_hash');

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Portal->value,
            'action' => PortalAuditAction::AssociateProfileViewed->value,
            'subject_id' => $associate->id,
            'actor_user_id' => $admin->id,
            'metadata->scope' => 'admin',
        ]);

        $event = $admin->auditEvents()->latest('occurred_at')->firstOrFail();
        $this->assertStringNotContainsString('1099001122', $event->toJson());
    }

    public function test_admin_can_export_profile_as_private_xlsx(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $associate = $this->associateWithProfile($admin, '=FORMULA');

        $response = $this->actingAs($admin)
            ->get("/admin/associates/{$associate->id}/profile/export")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->assertHeader('Cache-Control', 'max-age=0, no-store, private');

        $path = tempnam(sys_get_temp_dir(), 'fonasin-profile-');
        file_put_contents($path, $response->getContent());
        $spreadsheet = SimpleXLSX::parse($path);
        @unlink($path);

        $this->assertNotFalse($spreadsheet, SimpleXLSX::parseError());
        $contents = json_encode($spreadsheet->rows(), JSON_THROW_ON_ERROR);
        $this->assertStringContainsString('Ficha consolidada del asociado', $contents);
        $this->assertStringContainsString("'=FORMULA", $contents);
        $this->assertStringContainsString('PAG-001', $contents);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Portal->value,
            'action' => PortalAuditAction::AssociateProfileExported->value,
            'subject_id' => $associate->id,
            'actor_user_id' => $admin->id,
        ]);
    }

    public function test_unknown_document_returns_not_found_without_leaking_other_profiles(): void
    {
        $admin = $this->userWithRole('admin');
        $this->associateWithProfile($admin);

        $this->actingAs($admin)
            ->postJson('/admin/associates/profile/search', ['document_number' => '9999999999'])
            ->assertNotFound()
            ->assertJsonMissing(['document_number' => '1099001122']);
    }

    private function associateWithProfile(?User $admin = null, string $firstName = 'Persona'): Associate
    {
        $admin ??= $this->userWithRole('admin', 'profile-admin@example.test');
        $user = $this->userWithRole('associate', 'associate-profile@example.test');
        $cipher = app(EncryptsSensitiveData::class);
        $hasher = app(HashesSensitiveData::class);
        $associate = Associate::query()->create([
            'user_id' => $user->id,
            'document_type' => 'CC',
            'document_number_hash' => $hasher->documentNumber('1099001122'),
            'document_number_encrypted' => $cipher->encryptArray(['document_number' => '1099001122']),
            'full_name' => 'Persona Asociada Prueba',
            'status' => 'active',
        ]);
        $application = AffiliationApplication::query()->create([
            'associate_id' => $associate->id,
            'purpose' => AffiliationApplicationPurpose::InitialAffiliation->value,
            'status' => AffiliationApplicationStatus::Enabled->value,
            'current_step' => AffiliationApplicationStep::Summary->value,
            'submitted_at' => now(),
        ]);
        ApplicationSection::query()->forceCreate([
            'application_id' => $application->id,
            'section' => AffiliationApplicationStep::Personal->value,
            'schema_version' => 1,
            'data_encrypted' => $cipher->encryptArray([
                'firstName' => $firstName,
                'email' => 'associate-profile@example.test',
            ]),
            'completed_at' => now(),
        ]);
        CreditAccount::query()->create([
            'associate_id' => $associate->id,
            'credit_line' => 'FONALIBRE',
            'promissory_note_number_hash' => $hasher->financialReference('PAG-001'),
            'promissory_note_number_encrypted' => $cipher->encryptArray(['promissory_note_number' => 'PAG-001']),
            'initial_balance' => 1000000,
            'current_balance' => 750000,
            'term_months' => 12,
            'interest_rate' => 1.2,
            'installment_amount' => 100000,
            'last_payment_date' => '2026-09-10',
            'status' => 'active',
            'registered_by_user_id' => $admin->id,
        ]);
        $account = ContributionAccount::query()->create([
            'associate_id' => $associate->id,
            'contribution_balance' => 200000,
            'permanent_savings_balance' => 150000,
            'voluntary_savings_balance' => 50000,
            'total_balance' => 400000,
            'status' => 'active',
            'last_period' => '2026-09-01',
            'last_cut_off_date' => '2026-09-10',
        ]);
        ContributionMovement::query()->create([
            'contribution_account_id' => $account->id,
            'associate_id' => $associate->id,
            'recorded_by_user_id' => $admin->id,
            'movement_type' => 'contribution',
            'period' => '2026-09-01',
            'cut_off_date' => '2026-09-10',
            'amount' => 200000,
            'balance_after' => 200000,
            'status' => 'registered',
            'source' => 'manual',
            'reference' => 'APORTE-2026-09',
            'recorded_at' => now(),
        ]);

        return $associate;
    }

    private function userWithRole(string $roleName, string $email = 'user@example.test'): User
    {
        $user = User::factory()->create([
            'email' => $email,
            'status' => 'active',
            'must_change_password' => false,
        ]);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
