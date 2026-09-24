<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Models\Associate;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubmitVoluntarySavingsRequest
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
        private readonly GenerateVoluntarySavingsPayrollAuthorization $generatePayrollAuthorization,
    ) {}

    public function __invoke(User $actor, int $monthlyAmount, ?string $ipHash = null): VoluntarySavingsRequest
    {
        $associateId = $actor->associate()->value('id');

        if (! $associateId) {
            throw new DomainException('Se requiere un asociado activo para solicitar ahorro voluntario.');
        }

        return DB::transaction(function () use ($actor, $associateId, $ipHash, $monthlyAmount): VoluntarySavingsRequest {
            $associate = Associate::query()->lockForUpdate()->find($associateId);

            if (! $associate || $associate->status !== 'active') {
                throw new DomainException('Se requiere un asociado activo para solicitar ahorro voluntario.');
            }

            if ($associate->voluntarySavingsRequests()->where('status', VoluntarySavingsRequestStatus::Submitted->value)->exists()) {
                throw new DomainException('Ya tienes una solicitud de ahorro voluntario pendiente de revision.');
            }

            $requestId = (string) Str::uuid();
            $submittedAt = now();
            $request = VoluntarySavingsRequest::query()->forceCreate([
                'id' => $requestId,
                'associate_id' => $associate->id,
                'monthly_amount' => $monthlyAmount,
                'status' => VoluntarySavingsRequestStatus::Submitted->value,
                'authorization_storage_key' => "contributions/voluntary-savings/{$associate->id}/{$requestId}-libranza.pdf",
                'submitted_at' => $submittedAt,
            ]);
            $request = ($this->generatePayrollAuthorization)($request);

            ($this->recordAuditEvent)(
                module: AuditModule::Contributions,
                action: ContributionAuditAction::VoluntarySavingsRequested->value,
                subjectType: 'voluntary_savings_request',
                subjectId: $request->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['status' => $request->status],
                occurredAt: $submittedAt,
            );

            return $request;
        });
    }
}
