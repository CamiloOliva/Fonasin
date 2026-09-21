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

class ContributionPortalHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_portal_contributions(): void
    {
        $this->getJson('/portal/contributions')->assertUnauthorized();
    }

    public function test_user_without_associate_gets_domain_error_on_portal_contributions(): void
    {
        $user = $this->userWithRole('associate');

        $this->actingAs($user)
            ->getJson('/portal/contributions')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'User does not have an associate profile.');
    }

    public function test_inactive_associate_cannot_view_portal_contributions(): void
    {
        $user = $this->userWithRole('associate');
        $this->createAssociate($user, ['status' => 'inactive']);

        $this->actingAs($user)
            ->getJson('/portal/contributions')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Associate account is inactive.');
    }

    public function test_portal_contributions_distinguish_module_disabled(): void
    {
        config(['features.contributions.enabled' => false]);
        $user = $this->userWithRole('associate');
        $this->createAssociate($user);

        $this->actingAs($user)
            ->getJson('/portal/contributions')
            ->assertOk()
            ->assertJsonPath('data.state', 'module_disabled')
            ->assertJsonPath('data.account', null)
            ->assertJsonPath('data.movements', []);
    }

    public function test_portal_contributions_distinguish_associate_without_data(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate($user);

        $this->actingAs($user)
            ->getJson('/portal/contributions')
            ->assertOk()
            ->assertJsonPath('data.state', 'empty')
            ->assertJsonPath('data.account', null)
            ->assertJsonPath('data.movements', []);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Portal->value,
            'action' => ContributionAuditAction::ContributionViewed->value,
            'subject_id' => $associate->id,
            'metadata->state' => 'empty',
        ]);
    }

    public function test_associate_can_view_only_own_contributions(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate($user);
        $otherUser = $this->userWithRole('associate', 'other.associate@example.test');
        $otherAssociate = $this->createAssociate($otherUser);

        $account = $this->createContributionAccount($associate, [
            'permanent_savings_balance' => 150000,
            'voluntary_savings_balance' => 50000,
            'total_balance' => 200000,
        ]);
        $otherAccount = $this->createContributionAccount($otherAssociate, [
            'permanent_savings_balance' => 900000,
            'voluntary_savings_balance' => 100000,
            'total_balance' => 1000000,
        ]);

        $movement = $this->createContributionMovement($account, [
            'amount' => 200000,
            'balance_after' => 200000,
            'reference' => 'OWN-001',
        ]);
        $this->createContributionMovement($otherAccount, [
            'amount' => 1000000,
            'balance_after' => 1000000,
            'reference' => 'OTHER-001',
        ]);

        $this->actingAs($user)
            ->getJson('/portal/contributions?associate_id='.$otherAssociate->id)
            ->assertOk()
            ->assertJsonPath('data.state', 'available')
            ->assertJsonPath('data.account.id', $account->id)
            ->assertJsonPath('data.account.total_balance', '200000.00')
            ->assertJsonPath('data.movements.0.id', $movement->id)
            ->assertJsonPath('data.movements.0.reference', 'OWN-001')
            ->assertJsonMissing(['reference' => 'OTHER-001']);
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

    private function createAssociate(User $user, array $overrides = []): Associate
    {
        return Associate::query()->create([
            'user_id' => $user->id,
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', (string) Str::uuid()),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Associate',
            'status' => 'active',
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
