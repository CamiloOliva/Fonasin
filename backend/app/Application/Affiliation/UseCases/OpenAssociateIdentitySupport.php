<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\ReadsPrivateFiles;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\User;
use DomainException;
use Throwable;

class OpenAssociateIdentitySupport
{
    public function __construct(private readonly ReadsPrivateFiles $files, private readonly RecordAuditEvent $audit) {}

    /** @return resource */
    public function __invoke(Associate $associate, User $actor, ?string $ipHash): mixed
    {
        $key = $associate->identity_support_storage_key;
        if (! is_string($key) || $key === '') {
            throw new DomainException('El soporte no esta disponible.');
        }
        $stream = $this->files->open($key);
        if (! is_resource($stream)) {
            throw new DomainException('El soporte no esta disponible.');
        }
        try {
            ($this->audit)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::AssociateIdentitySupportDownloaded->value,
                subjectType: 'associate',
                subjectId: $associate->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['scope' => 'admin'],
            );
        } catch (Throwable $exception) {
            fclose($stream);
            throw $exception;
        }

        return $stream;
    }
}
