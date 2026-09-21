<?php

namespace App\Application\Credits\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Credits\Exceptions\CannotManageCreditAccount;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisterCreditAccount
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array{
     *     credit_line: string,
     *     initial_balance: int|float|string,
     *     current_balance: int|float|string,
     *     term_months: int,
     *     interest_rate: int|float|string,
     *     installment_amount: int|float|string,
     *     status?: string
     * }  $data
     */
    public function __invoke(
        Associate $associate,
        User $actor,
        array $data,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): CreditAccount {
        return DB::transaction(function () use ($associate, $actor, $data, $correlationId, $ipHash) {
            $correlationId ??= (string) Str::uuid();

            if ($associate->status !== 'active') {
                throw CannotManageCreditAccount::associateMustBeActive();
            }

            $credit = CreditAccount::query()->create([
                'associate_id' => $associate->id,
                'credit_line' => $data['credit_line'],
                'initial_balance' => $data['initial_balance'],
                'current_balance' => $data['current_balance'],
                'term_months' => $data['term_months'],
                'interest_rate' => $data['interest_rate'],
                'installment_amount' => $data['installment_amount'],
                'status' => $data['status'] ?? CreditAccountStatus::Active->value,
                'registered_by_user_id' => $actor->id,
            ]);

            ($this->recordAuditEvent)(
                module: AuditModule::Credits,
                action: CreditAuditAction::CreditRegistered->value,
                subjectType: 'credit_account',
                subjectId: $credit->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'associate_id' => $associate->id,
                    'credit_line' => $credit->credit_line,
                    'status' => $credit->status,
                ],
            );

            return $credit->refresh();
        });
    }
}
