<?php

namespace Tests\Feature;

use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreditAccountHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_manage_credits(): void
    {
        $associate = $this->createAssociate();

        $this->postJson('/admin/credits', [
            'associate_id' => $associate->id,
            ...$this->creditData(),
        ])->assertUnauthorized();
    }

    public function test_user_without_backoffice_role_cannot_manage_credits(): void
    {
        $associate = $this->createAssociate();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/admin/credits', [
                'associate_id' => $associate->id,
                ...$this->creditData(),
            ])
            ->assertForbidden();
    }

    public function test_reviewer_can_register_credit_over_http(): void
    {
        $associate = $this->createAssociate();
        $reviewer = $this->userWithRole('reviewer');

        $response = $this->actingAs($reviewer)
            ->postJson('/admin/credits', [
                'associate_id' => $associate->id,
                ...$this->creditData(),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.associate_id', $associate->id)
            ->assertJsonPath('data.credit_line', 'FONALIBRE')
            ->assertJsonPath('data.status', CreditAccountStatus::Active->value);

        $creditId = $response->json('data.id');
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => CreditAuditAction::CreditRegistered->value,
            'subject_id' => $creditId,
        ]);
    }

    public function test_admin_can_update_credit_over_http(): void
    {
        $admin = $this->userWithRole('admin');
        $credit = $this->createCredit($admin);

        $response = $this->actingAs($admin)
            ->patchJson("/admin/credits/{$credit->id}", [
                'current_balance' => '900000.00',
                'status' => CreditAccountStatus::Settled->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.current_balance', '900000.00')
            ->assertJsonPath('data.status', CreditAccountStatus::Settled->value);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->id,
            'action' => CreditAuditAction::CreditUpdated->value,
            'subject_id' => $credit->id,
        ]);
    }

    public function test_reviewer_can_archive_credit_over_http(): void
    {
        $reviewer = $this->userWithRole('reviewer');
        $credit = $this->createCredit($reviewer);

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/credits/{$credit->id}/archive");

        $response->assertOk()
            ->assertJsonPath('data.status', CreditAccountStatus::Archived->value);

        $this->assertDatabaseHas('credit_accounts', [
            'id' => $credit->id,
            'status' => CreditAccountStatus::Archived->value,
        ]);
    }

    public function test_associate_can_view_only_their_non_archived_credits(): void
    {
        $user = $this->userWithRole('associate');
        $associate = $this->createAssociate(['user_id' => $user->id]);
        $registrar = $this->userWithRole('reviewer');
        $ownCredit = $this->createCredit($registrar, $associate);
        $archivedCredit = $this->createCredit($registrar, $associate);
        $archivedCredit->forceFill(['status' => CreditAccountStatus::Archived->value])->save();
        $this->createCredit($registrar, $this->createAssociate());

        $response = $this->actingAs($user)->getJson('/portal/credits');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownCredit->id);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $user->id,
            'action' => CreditAuditAction::CreditViewed->value,
            'subject_id' => $associate->id,
        ]);
    }

    public function test_user_without_associate_gets_domain_error_on_portal_credits(): void
    {
        $user = $this->userWithRole('associate');

        $this->actingAs($user)
            ->getJson('/portal/credits')
            ->assertUnprocessable();
    }

    /**
     * @param  array<string, string>  $overrides
     */
    private function createAssociate(array $overrides = []): Associate
    {
        $reference = (string) Str::uuid();

        return Associate::query()->create([
            'document_type' => 'test',
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

    private function createCredit(User $registrar, ?Associate $associate = null): CreditAccount
    {
        return CreditAccount::query()->create([
            'associate_id' => ($associate ?? $this->createAssociate())->id,
            'registered_by_user_id' => $registrar->id,
            ...$this->creditData(),
        ]);
    }

    /**
     * @return array<string, int|string>
     */
    private function creditData(): array
    {
        return [
            'credit_line' => 'FONALIBRE',
            'initial_balance' => '1250000.50',
            'current_balance' => '1000000.25',
            'term_months' => 24,
            'interest_rate' => '1.2500',
            'installment_amount' => '52000.75',
            'status' => CreditAccountStatus::Active->value,
        ];
    }
}
