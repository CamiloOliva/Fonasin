<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotManageAssociate;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateAssociateStatus
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        Associate $associate,
        string $status,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): Associate {
        return DB::transaction(function () use ($associate, $status, $actor, $correlationId, $ipHash): Associate {
            if (! in_array($status, ['active', 'inactive'], true)) {
                throw CannotManageAssociate::invalidStatus($status);
            }

            $fromStatus = $associate->status;

            $associate->forceFill([
                'status' => $status,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: $status === 'active'
                    ? AffiliationAuditAction::AssociateActivated->value
                    : AffiliationAuditAction::AssociateDeactivated->value,
                subjectType: 'associate',
                subjectId: $associate->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId ?? (string) Str::uuid(),
                ipHash: $ipHash,
                metadata: [
                    'status' => [
                        'from' => $fromStatus,
                        'to' => $status,
                    ],
                ],
            );

            return $associate->refresh();
        });
    }
}
