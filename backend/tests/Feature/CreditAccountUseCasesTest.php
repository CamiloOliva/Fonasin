<?php

namespace Tests\Feature;

use App\Application\Credits\Exceptions\CannotManageCreditAccount;
use App\Application\Credits\UseCases\ArchiveCreditAccount;
use App\Application\Credits\UseCases\RegisterCreditAccount;
use App\Application\Credits\UseCases\UpdateCreditAccount;
use App\Application\Credits\UseCases\ViewAssociateCredits;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreditAccountUseCasesTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_registers_credit_account_and_records_audit_event(): void
    {
        $associate = $this->createAssociate();
        $actor = User::factory()->create();

        $credit = app(RegisterCreditAccount::class)(
            associate: $associate,
            actor: $actor,
            data: $this->creditData(),
        );

        $this->assertSame($associate->id, $credit->associate_id);
        $this->assertSame($actor->id, $credit->registered_by_user_id);
        $this->assertSame(CreditAccountStatus::Active->value, $credit->status);
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $actor->id,
            'module' => AuditModule::Credits->value,
            'action' => CreditAuditAction::CreditRegistered->value,
            'subject_id' => $credit->id,
        ]);
    }

    public function test_it_updates_credit_account_with_redacted_audit_metadata(): void
    {
        $actor = User::factory()->create();
        $credit = $this->createCredit($actor);

        $updated = app(UpdateCreditAccount::class)(
            credit: $credit,
            actor: $actor,
            data: [
                'current_balance' => '850000.00',
                'status' => CreditAccountStatus::Settled->value,
            ],
        );

        $this->assertSame('850000.00', $updated->current_balance);
        $this->assertSame(CreditAccountStatus::Settled->value, $updated->status);

        $event = $actor->auditEvents()
            ->where('action', CreditAuditAction::CreditUpdated->value)
            ->where('subject_id', $credit->id)
            ->firstOrFail();

        $this->assertContains('current_balance', $event->metadata['changed_fields']);
        $this->assertSame('redacted', $event->metadata['changes']['current_balance']['from']);
        $this->assertSame('redacted', $event->metadata['changes']['current_balance']['to']);
        $this->assertSame('active', $event->metadata['changes']['status']['from']);
        $this->assertSame('settled', $event->metadata['changes']['status']['to']);
    }

    public function test_it_archives_credit_account_without_deleting_it(): void
    {
        $actor = User::factory()->create();
        $credit = $this->createCredit($actor);

        $archived = app(ArchiveCreditAccount::class)($credit, $actor);

        $this->assertSame(CreditAccountStatus::Archived->value, $archived->status);
        $this->assertDatabaseHas('credit_accounts', [
            'id' => $credit->id,
            'status' => CreditAccountStatus::Archived->value,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $actor->id,
            'action' => CreditAuditAction::CreditArchived->value,
            'subject_id' => $credit->id,
        ]);
    }

    public function test_archived_credit_cannot_be_updated(): void
    {
        $actor = User::factory()->create();
        $credit = $this->createCredit($actor);
        $credit->forceFill(['status' => CreditAccountStatus::Archived->value])->save();

        $this->expectException(CannotManageCreditAccount::class);

        app(UpdateCreditAccount::class)($credit, $actor, ['current_balance' => '100.00']);
    }

    public function test_it_views_authenticated_associate_credits_without_browser_associate_id(): void
    {
        $user = User::factory()->create();
        $associate = $this->createAssociate(['user_id' => $user->id]);
        $otherAssociate = $this->createAssociate();
        $ownCredit = $this->createCredit(User::factory()->create(), $associate);
        $archivedCredit = $this->createCredit(User::factory()->create(), $associate);
        $archivedCredit->forceFill(['status' => CreditAccountStatus::Archived->value])->save();
        $this->createCredit(User::factory()->create(), $otherAssociate);

        $credits = app(ViewAssociateCredits::class)($user);

        $this->assertCount(1, $credits);
        $this->assertTrue($credits->first()->is($ownCredit));
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $user->id,
            'module' => AuditModule::Portal->value,
            'action' => CreditAuditAction::CreditViewed->value,
            'subject_id' => $associate->id,
        ]);
    }

    public function test_user_without_associate_cannot_view_portal_credits(): void
    {
        $this->expectException(CannotManageCreditAccount::class);

        app(ViewAssociateCredits::class)(User::factory()->create());
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

    private function createCredit(User $actor, ?Associate $associate = null): CreditAccount
    {
        return CreditAccount::query()->create([
            'associate_id' => ($associate ?? $this->createAssociate())->id,
            'registered_by_user_id' => $actor->id,
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
