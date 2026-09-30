<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\ReadsPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Throwable;

class OpenVoluntarySavingsAuthorization
{
    public function __construct(private readonly ReadsPrivateFiles $files, private readonly RecordAuditEvent $audit) {}

    /** @return resource Policy authorization must have succeeded before invocation. */
    public function __invoke(VoluntarySavingsRequest $request, User $actor, bool $signed, bool $download, string $scope, ?string $ipHash): mixed
    {
        $key = (string) $request->getAttribute($signed ? 'signed_authorization_storage_key' : 'authorization_storage_key');
        $stream = $this->files->open($key);
        if (! is_resource($stream)) {
            throw new DomainException('El documento no esta disponible.');
        }
        try {
            $action = $signed
                ? ($download ? ContributionAuditAction::VoluntarySavingsSignedAuthorizationDownloaded : ContributionAuditAction::VoluntarySavingsSignedAuthorizationViewed)
                : ($download ? ContributionAuditAction::VoluntarySavingsPayrollAuthorizationDownloaded : ContributionAuditAction::VoluntarySavingsPayrollAuthorizationViewed);
            ($this->audit)(
                module: AuditModule::Contributions,
                action: $action->value,
                subjectType: 'voluntary_savings_request',
                subjectId: $request->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['scope' => $scope],
            );
        } catch (Throwable $exception) {
            fclose($stream);
            throw $exception;
        }

        return $stream;
    }
}
