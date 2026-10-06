<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreAssociateIdentitySupport
{
    public function __construct(
        private readonly StoresPrivateFiles $files,
        private readonly RecordAuditEvent $audit,
    ) {}

    public function __invoke(Associate $associate, User $actor, string $contents, string $mime, ?string $ipHash): Associate
    {
        return DB::transaction(function () use ($associate, $actor, $contents, $mime, $ipHash): Associate {
            $locked = Associate::query()->lockForUpdate()->findOrFail($associate->id);
            if (! $locked->legacy_validation_required || $locked->status !== 'inactive') {
                throw new DomainException('El soporte solo puede cargarse para un asociado antiguo pendiente de validacion.');
            }
            if ($locked->identity_support_storage_key) {
                throw new DomainException('El asociado ya tiene una copia de cedula registrada.');
            }

            $extension = match ($mime) {
                'application/pdf' => 'pdf',
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                default => throw new DomainException('El soporte debe ser PDF, JPG o PNG.'),
            };
            $storageKey = 'private/associates/'.$locked->id.'/identity/'.Str::uuid().'.'.$extension;
            $this->files->put($storageKey, $contents);
            $locked->forceFill([
                'identity_support_storage_key' => $storageKey,
                'identity_support_mime_type' => $mime,
            ])->save();

            ($this->audit)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::AssociateIdentitySupportUploaded->value,
                subjectType: 'associate',
                subjectId: $locked->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['mime_type' => $mime, 'byte_size' => strlen($contents)],
            );

            return $locked->refresh();
        });
    }
}
