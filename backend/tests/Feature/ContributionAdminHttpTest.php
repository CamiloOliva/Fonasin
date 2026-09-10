<?php

namespace Tests\Feature;

use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ContributionAdminHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_contribution_accounts(): void
    {
        $this->getJson('/admin/contributions')->assertUnauthorized();
    }

    public function test_associate_cannot_list_contribution_accounts_or_movements(): void
    {
        $associateUser = $this->userWithRole('associate');
        $account = $this->createAccount($this->createAssociate($associateUser));

        $this->actingAs($associateUser)
            ->getJson('/admin/contributions')
            ->assertForbidden();

        $this->actingAs($associateUser)
            ->getJson("/admin/contributions/{$account->id}/movements")
            ->assertForbidden();
    }

    public function test_reviewer_can_filter_and_paginate_contribution_accounts(): void
    {
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');
        $firstAssociate = $this->createAssociate($this->userWithRole('associate', 'first@example.test'), 'First Associate');
        $secondAssociate = $this->createAssociate($this->userWithRole('associate', 'second@example.test'), 'Second Associate');
        $firstAccount = $this->createAccount($firstAssociate, [
            'permanent_savings_balance' => 150000,
            'total_balance' => 150000,
            'last_period' => '2026-09-01',
        ]);
        $secondAccount = $this->createAccount($secondAssociate, [
            'status' => 'inactive',
            'last_period' => '2026-08-01',
        ]);
        $this->createMovement($firstAccount, ['period' => '2026-09-01', 'reference' => 'SEP-001']);
        $this->createMovement($secondAccount, ['period' => '2026-08-01', 'reference' => 'AUG-001']);

        $this->actingAs($reviewer)
            ->getJson("/admin/contributions?associate_id={$firstAssociate->id}&status=active&period=2026-09&per_page=1")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $firstAccount->id)
            ->assertJsonPath('data.0.associate.full_name', 'First Associate')
            ->assertJsonPath('data.0.total_balance', '150000.00')
            ->assertJsonPath('data.0.movements_count', 1)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 1);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Contributions->value,
            'action' => ContributionAuditAction::ContributionAccountCollectionViewed->value,
            'actor_user_id' => $reviewer->id,
            'metadata->scope' => 'admin',
            'metadata->filters->status' => 'active',
            'metadata->filters->period' => '2026-09',
        ]);
    }

    public function test_admin_can_filter_paginated_movements_for_one_account(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $associate = $this->createAssociate($this->userWithRole('associate'));
        $otherAssociate = $this->createAssociate($this->userWithRole('associate', 'other@example.test'));
        $account = $this->createAccount($associate);
        $otherAccount = $this->createAccount($otherAssociate);
        $expected = $this->createMovement($account, [
            'movement_type' => 'voluntary_savings',
            'period' => '2026-09-01',
            'reference' => 'OWN-001',
            'recorded_by_user_id' => $admin->id,
        ]);
        $this->createMovement($account, [
            'movement_type' => 'permanent_savings',
            'period' => '2026-08-01',
            'reference' => 'OLD-001',
        ]);
        $this->createMovement($otherAccount, [
            'movement_type' => 'voluntary_savings',
            'period' => '2026-09-01',
            'reference' => 'OTHER-001',
        ]);

        $this->actingAs($admin)
            ->getJson("/admin/contributions/{$account->id}/movements?movement_type=voluntary_savings&status=registered&period=2026-09&per_page=1")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $expected->id)
            ->assertJsonPath('data.0.reference', 'OWN-001')
            ->assertJsonPath('data.0.recorded_by.email', 'admin@example.test')
            ->assertJsonPath('account.id', $account->id)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissingPath('data.0.source_row_hash')
            ->assertJsonMissing(['reference' => 'OTHER-001']);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Contributions->value,
            'action' => ContributionAuditAction::ContributionMovementCollectionViewed->value,
            'subject_id' => $account->id,
            'actor_user_id' => $admin->id,
            'metadata->filters->movement_type' => 'voluntary_savings',
        ]);
    }

    public function test_admin_contribution_filters_are_validated(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $account = $this->createAccount($this->createAssociate($this->userWithRole('associate')));

        $this->actingAs($admin)
            ->getJson('/admin/contributions?status=unknown&period=09-2026&per_page=101')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'period', 'per_page']);

        $this->actingAs($admin)
            ->getJson("/admin/contributions/{$account->id}/movements?movement_type=unknown")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['movement_type']);
    }

    private function userWithRole(string $roleName, string $email = 'associate@example.test'): User
    {
        $user = User::factory()->create([
            'email' => $email,
            'status' => 'active',
        ]);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }

    private function createAssociate(User $user, string $fullName = 'Synthetic Associate'): Associate
    {
        return Associate::query()->create([
            'user_id' => $user->id,
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', (string) Str::uuid()),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => $fullName,
            'status' => 'active',
        ]);
    }

    private function createAccount(Associate $associate, array $overrides = []): ContributionAccount
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

    private function createMovement(ContributionAccount $account, array $overrides = []): ContributionMovement
    {
        return ContributionMovement::query()->create([
            'contribution_account_id' => $account->id,
            'associate_id' => $account->associate_id,
            'movement_type' => 'permanent_savings',
            'period' => '2026-09-01',
            'cut_off_date' => '2026-09-30',
            'amount' => 100000,
            'balance_after' => 100000,
            'status' => 'registered',
            'source' => 'manual',
            'reference' => 'REF-001',
            'recorded_at' => now(),
            ...$overrides,
        ]);
    }
}
