<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotReviewAffiliationApplication;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Support\AffiliationApplicationStateMachine;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StartAffiliationReview
{
    public function __construct(
        private readonly AffiliationApplicationStateMachine $stateMachine,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        AffiliationApplication $application,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $reviewedAt = null,
    ): AffiliationApplication {
        return DB::transaction(function () use ($application, $actor, $correlationId, $ipHash, $reviewedAt) {
            $application->refresh();
            $fromStatus = AffiliationApplicationStatus::from($application->status);
            $toStatus = AffiliationApplicationStatus::UnderReview;

            if (! $this->stateMachine->canTransition($fromStatus, $toStatus)) {
                throw CannotReviewAffiliationApplication::invalidStatus($fromStatus, $toStatus);
            }

            $reviewedAt ??= now();
            $correlationId ??= (string) Str::uuid();

            $application->forceFill([
                'status' => $toStatus->value,
                'reviewed_by_user_id' => $actor->id,
                'reviewed_at' => $reviewedAt,
                'rejection_reason' => null,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::ApplicationReviewStarted->value,
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
                ],
                occurredAt: $reviewedAt,
            );

            return $application->refresh();
        });
    }
}
