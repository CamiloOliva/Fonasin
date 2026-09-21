<?php

namespace App\Application\Credits\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Credits\Exceptions\CannotManageCreditAccount;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateCreditAccount
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array<string, int|float|string>  $data
     */
    public function __invoke(
        CreditAccount $credit,
        User $actor,
        array $data,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): CreditAccount {
        return DB::transaction(function () use ($credit, $actor, $data, $correlationId, $ipHash) {
            $credit->refresh();

            if ($credit->status === CreditAccountStatus::Archived->value) {
                throw CannotManageCreditAccount::archivedCreditCannotBeUpdated();
            }

            $correlationId ??= (string) Str::uuid();
            $allowed = [
                'credit_line',
                'initial_balance',
                'current_balance',
                'term_months',
                'interest_rate',
                'installment_amount',
                'status',
            ];
            $updates = array_intersect_key($data, array_flip($allowed));

            if (isset($updates['status'])) {
                $this->ensureStatusTransitionIsAllowed(
                    from: (string) $credit->getAttribute('status'),
                    to: (string) $updates['status'],
                );
            }

            $changes = [];

            foreach ($updates as $field => $value) {
                if ((string) $credit->getAttribute($field) !== (string) $value) {
                    $changes[$field] = [
                        'from' => $field === 'status' ? $credit->getAttribute($field) : 'redacted',
                        'to' => $field === 'status' ? $value : 'redacted',
                    ];
                }
            }

            $credit->forceFill($updates)->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Credits,
                action: CreditAuditAction::CreditUpdated->value,
                subjectType: 'credit_account',
                subjectId: $credit->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'changed_fields' => array_keys($changes),
                    'changes' => $changes,
                ],
            );

            return $credit->refresh();
        });
    }

    private function ensureStatusTransitionIsAllowed(string $from, string $to): void
    {
        if ($from === $to) {
            return;
        }

        $allowedTransitions = [
            CreditAccountStatus::Active->value => [
                CreditAccountStatus::Settled->value,
                CreditAccountStatus::Archived->value,
            ],
            CreditAccountStatus::Settled->value => [
                CreditAccountStatus::Archived->value,
            ],
        ];

        if (! in_array($to, $allowedTransitions[$from] ?? [], true)) {
            throw CannotManageCreditAccount::invalidStatusTransition($from, $to);
        }
    }
}
