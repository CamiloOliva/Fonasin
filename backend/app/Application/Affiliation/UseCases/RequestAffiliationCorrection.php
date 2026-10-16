<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Contracts\DeliversAffiliationCorrections;
use App\Application\Affiliation\Exceptions\CannotReviewAffiliationApplication;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Support\AffiliationApplicationStateMachine;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RequestAffiliationCorrection
{
    public function __construct(
        private readonly AffiliationApplicationStateMachine $stateMachine,
        private readonly RecordAuditEvent $recordAuditEvent,
        private readonly EncryptsSensitiveData $cipher,
        private readonly DeliversAffiliationCorrections $delivery,
    ) {}

    public function __invoke(
        AffiliationApplication $application,
        User $actor,
        ?string $reason = null,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $reviewedAt = null,
    ): AffiliationApplication {
        return DB::transaction(function () use ($application, $actor, $reason, $correlationId, $ipHash, $reviewedAt) {
            $application = AffiliationApplication::query()->lockForUpdate()->findOrFail($application->id);
            $fromStatus = AffiliationApplicationStatus::from($application->status);
            $toStatus = AffiliationApplicationStatus::PendingCorrection;

            if ($fromStatus !== $toStatus && ! $this->stateMachine->canTransition($fromStatus, $toStatus)) {
                throw CannotReviewAffiliationApplication::invalidStatus($fromStatus, $toStatus);
            }

            if (! filled($reason)) {
                throw new \DomainException('Indica las correcciones que debe realizar el solicitante.');
            }
            $personal = $application->sections()->where('section', 'personal')->first();
            $data = $personal ? $this->cipher->decryptArray($personal->getAttribute('data_encrypted')) : [];
            $email = $application->associate?->user?->email ?? ($data['email'] ?? '');
            if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \DomainException('La solicitud no tiene un correo valido para enviar el enlace de correccion.');
            }

            $reviewedAt ??= now();
            $correlationId ??= (string) Str::uuid();
            $token = Str::random(64);
            $expiresAt = now()->addHours(24);
            $application->corrections()->whereNull('completed_at')->whereNull('revoked_at')->update(['revoked_at' => now()]);
            $correction = $application->corrections()->create([
                'requested_by_user_id' => $actor->id,
                'reason_encrypted' => $this->cipher->encryptArray(['reason' => trim($reason)]),
                'expires_at' => $expiresAt,
            ]);
            // A correction can change payroll values. A previous employer
            // authorization must never approve the newly generated document.
            $archivedSigned = $application->documents()
                ->where('document_type', ApplicationDocumentType::SignedPayrollAuthorization->value)
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->update(['status' => ApplicationDocumentStatus::Archived->value]);

            $application->forceFill([
                'status' => $toStatus->value,
                'reviewed_by_user_id' => $actor->id,
                'reviewed_at' => $reviewedAt,
                'rejection_reason' => null,
                'access_token_hash' => hash('sha256', $token),
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::ApplicationCorrectionRequested->value,
                subjectType: 'affiliation_application',
                subjectId: $application->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'status' => [
                        'from' => $fromStatus->value,
                        'to' => $toStatus->value,
                    ],
                    'reason_provided' => filled($reason),
                    'correction_id' => $correction->id,
                    'archived_signed_authorizations' => $archivedSigned,
                ],
                occurredAt: $reviewedAt,
            );

            // A delivery failure rolls back the state, token and audit together.
            $this->delivery->send($application, $email, $token, $expiresAt);

            return $application->refresh();
        });
    }
}
