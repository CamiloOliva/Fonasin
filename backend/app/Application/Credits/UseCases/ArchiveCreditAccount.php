<?php

namespace App\Application\Credits\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ArchiveCreditAccount
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        CreditAccount $credit,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): CreditAccount {
        return DB::transaction(function () use ($credit, $actor, $correlationId, $ipHash) {
            $credit->refresh();
            $fromStatus = $credit->status;
            $correlationId ??= (string) Str::uuid();

            $credit->forceFill([
                'status' => CreditAccountStatus::Archived->value,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Credits,
                action: CreditAuditAction::CreditArchived->value,
                subjectType: 'credit_account',
                subjectId: $credit->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'status' => [
                        'from' => $fromStatus,
                        'to' => CreditAccountStatus::Archived->value,
                    ],
                ],
            );

            return $credit->refresh();
        });
    }
}
