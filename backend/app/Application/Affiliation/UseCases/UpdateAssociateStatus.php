<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotManageAssociate;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\User;
use DomainException;
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

            if ($status === 'active' && $associate->legacy_validation_required && ! $associate->identity_support_storage_key) {
                throw new DomainException('Carga la copia de la cedula antes de aprobar este asociado antiguo.');
            }

            $associate->forceFill([
                'status' => $status,
                'legacy_validated_at' => $status === 'active' && $associate->legacy_validation_required ? now() : $associate->legacy_validated_at,
                'legacy_validated_by_user_id' => $status === 'active' && $associate->legacy_validation_required ? $actor->id : $associate->legacy_validated_by_user_id,
            ])->save();

            $linkedUser = $associate->user;

            if ($linkedUser) {
                $linkedUser->forceFill([
                    'status' => $status === 'active' ? 'active' : 'inactive',
                    'remember_token' => $status === 'active' ? $linkedUser->remember_token : null,
                ])->save();

                if ($status === 'inactive') {
                    DB::table('sessions')->where('user_id', $linkedUser->id)->delete();
                    DB::table('password_reset_tokens')->where('email', $linkedUser->email)->delete();
                }
            }

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
                    'linked_user_id' => $linkedUser?->id,
                    'linked_user_status' => $linkedUser?->status,
                    'sessions_revoked' => $status === 'inactive',
                ],
            );

            return $associate->refresh();
        });
    }
}
