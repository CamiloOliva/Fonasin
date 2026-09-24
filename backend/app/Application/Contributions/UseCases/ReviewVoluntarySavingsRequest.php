<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Support\Facades\DB;

class ReviewVoluntarySavingsRequest
{
    public function __construct(private readonly RecordAuditEvent $recordAuditEvent) {}

    public function __invoke(
        VoluntarySavingsRequest $request,
        VoluntarySavingsRequestStatus $status,
        User $actor,
        ?string $notes = null,
        ?string $ipHash = null,
    ): VoluntarySavingsRequest {
        return DB::transaction(function () use ($actor, $ipHash, $notes, $request, $status): VoluntarySavingsRequest {
            $lockedRequest = VoluntarySavingsRequest::query()->lockForUpdate()->findOrFail($request->id);

            if ($lockedRequest->status !== VoluntarySavingsRequestStatus::Submitted->value) {
                throw new DomainException('La solicitud de ahorro voluntario ya fue revisada.');
            }

            $lockedRequest->forceFill([
                'status' => $status->value,
                'pending_associate_id' => null,
                'reviewed_at' => now(),
                'reviewed_by_user_id' => $actor->id,
                'review_notes' => $notes,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Contributions,
                action: ContributionAuditAction::VoluntarySavingsRequestReviewed->value,
                subjectType: 'voluntary_savings_request',
                subjectId: $lockedRequest->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['status' => $status->value],
            );

            return $lockedRequest->refresh();
        });
    }
}
