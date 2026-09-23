<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\Contracts\RendersVoluntarySavingsAuthorization;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubmitVoluntarySavingsRequest
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly RendersVoluntarySavingsAuthorization $renderer,
        private readonly StoresPrivateFiles $privateFiles,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(User $actor, string $monthlyAmount, ?string $ipHash = null): VoluntarySavingsRequest
    {
        $associate = $actor->associate;

        if (! $associate || $associate->status !== 'active') {
            throw new DomainException('Se requiere un asociado activo para solicitar ahorro voluntario.');
        }

        if ($associate->voluntarySavingsRequests()->where('status', VoluntarySavingsRequestStatus::Submitted->value)->exists()) {
            throw new DomainException('Ya tienes una solicitud de ahorro voluntario pendiente de revision.');
        }

        $requestId = (string) Str::uuid();
        $submittedAt = now();
        $documentPayload = $this->cipher->decryptArray((string) $associate->getAttribute('document_number_encrypted'));
        $storageKey = "contributions/voluntary-savings/{$associate->id}/{$requestId}.pdf";
        $pdf = $this->renderer->render([
            'requestId' => $requestId,
            'fullName' => $associate->full_name,
            'documentType' => $associate->document_type,
            'documentNumber' => (string) ($documentPayload['document_number'] ?? ''),
            'monthlyAmount' => $monthlyAmount,
            'submittedAt' => $submittedAt->timezone('America/Bogota')->format('Y-m-d H:i'),
        ]);

        return DB::transaction(function () use ($actor, $associate, $ipHash, $monthlyAmount, $pdf, $requestId, $storageKey, $submittedAt): VoluntarySavingsRequest {
            $request = VoluntarySavingsRequest::query()->forceCreate([
                'id' => $requestId,
                'associate_id' => $associate->id,
                'monthly_amount' => $monthlyAmount,
                'status' => VoluntarySavingsRequestStatus::Submitted->value,
                'authorization_storage_key' => $storageKey,
                'submitted_at' => $submittedAt,
            ]);

            $this->privateFiles->put($storageKey, $pdf);

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
