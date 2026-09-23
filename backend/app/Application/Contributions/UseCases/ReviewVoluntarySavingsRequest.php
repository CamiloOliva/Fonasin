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
        if ($request->status !== VoluntarySavingsRequestStatus::Submitted->value) {
            throw new DomainException('La solicitud de ahorro voluntario ya fue revisada.');
        }

        return DB::transaction(function () use ($actor, $ipHash, $notes, $request, $status): VoluntarySavingsRequest {
            $request->forceFill([
                'status' => $status->value,
                'reviewed_at' => now(),
                'reviewed_by_user_id' => $actor->id,
                'review_notes' => $notes,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Contributions,
                action: ContributionAuditAction::VoluntarySavingsRequestReviewed->value,
                subjectType: 'voluntary_savings_request',
                subjectId: $request->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['status' => $status->value],
            );

            return $request->refresh();
        });
    }
}
