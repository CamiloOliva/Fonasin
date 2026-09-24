<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Support\Facades\DB;

class RegisterSignedVoluntarySavingsAuthorization
{
    public function __construct(
        private readonly StoresPrivateFiles $privateFiles,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        VoluntarySavingsRequest $request,
        string $contents,
        User $actor,
        ?string $ipHash = null,
    ): VoluntarySavingsRequest {
        return DB::transaction(function () use ($request, $contents, $actor, $ipHash): VoluntarySavingsRequest {
            $lockedRequest = VoluntarySavingsRequest::query()->lockForUpdate()->findOrFail($request->id);

            if ($lockedRequest->status !== VoluntarySavingsRequestStatus::Approved->value) {
                throw new DomainException('La solicitud debe estar aprobada antes de cargar la libranza firmada.');
            }

            if ($lockedRequest->getAttribute('signed_authorization_storage_key')) {
                throw new DomainException('La solicitud ya tiene una libranza firmada registrada.');
            }

            $storageKey = "contributions/voluntary-savings/{$lockedRequest->associate_id}/{$lockedRequest->id}-libranza-firmada.pdf";
            $this->privateFiles->put($storageKey, $contents);
            $lockedRequest->forceFill([
                'signed_authorization_storage_key' => $storageKey,
                'signed_authorization_uploaded_at' => now(),
                'signed_authorization_uploaded_by_user_id' => $actor->id,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Contributions,
                action: ContributionAuditAction::VoluntarySavingsSignedAuthorizationUploaded->value,
                subjectType: 'voluntary_savings_request',
                subjectId: $lockedRequest->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['mime_type' => 'application/pdf', 'byte_size' => strlen($contents)],
            );

            return $lockedRequest->refresh();
        });
    }
}
