<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotRegisterApplicationDocument;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisterApplicationDocument
{
    /**
     * @var list<string>
     */
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
    ];

    public function __construct(
        private readonly GeneratesPrivateStorageKeys $storageKeys,
        private readonly StoresPrivateFiles $privateFiles,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        AffiliationApplication $application,
        ApplicationDocumentType $documentType,
        string $originalFilename,
        string $mimeType,
        int $byteSize,
        ?User $actor = null,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $uploadedAt = null,
        ?string $fileContents = null,
        string $auditAction = AffiliationAuditAction::DocumentUploaded->value,
    ): ApplicationDocument {
        if ($byteSize <= 0) {
            throw CannotRegisterApplicationDocument::invalidByteSize($byteSize);
        }

        if (! in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw CannotRegisterApplicationDocument::invalidMimeType($mimeType);
        }

        return DB::transaction(function () use ($application, $documentType, $originalFilename, $mimeType, $byteSize, $actor, $correlationId, $ipHash, $uploadedAt, $fileContents, $auditAction) {
            $application = AffiliationApplication::query()->lockForUpdate()->findOrFail($application->id);
            if ($documentType === ApplicationDocumentType::SignedPayrollAuthorization
                && ($application->status !== 'approved' || $application->isFormOnly())) {
                throw new \DomainException('La libranza empresarial solo puede cargarse despues de aprobar la revision de la afiliacion vigente.');
            }
            $uploadedAt ??= now();
            $correlationId ??= (string) Str::uuid();

            $archivedCount = $application->documents()
                ->where('document_type', $documentType->value)
                ->where('status', '!=', ApplicationDocumentStatus::Archived->value)
                ->update(['status' => ApplicationDocumentStatus::Archived->value]);
            $archivedSigned = $documentType === ApplicationDocumentType::PayrollAuthorization
                ? $application->documents()->where('document_type', ApplicationDocumentType::SignedPayrollAuthorization->value)
                    ->where('status', '!=', ApplicationDocumentStatus::Archived->value)
                    ->update(['status' => ApplicationDocumentStatus::Archived->value])
                : 0;

            $document = ApplicationDocument::query()->forceCreate([
                'application_id' => $application->id,
                'document_type' => $documentType->value,
                'original_filename' => $originalFilename,
                'storage_key' => $this->storageKeys->forApplicationDocument($application, $documentType, $originalFilename),
                'mime_type' => $mimeType,
                'byte_size' => $byteSize,
                'status' => ApplicationDocumentStatus::Uploaded->value,
                'uploaded_at' => $uploadedAt,
            ]);

            if ($fileContents !== null) {
                $this->privateFiles->put($document->storage_key, $fileContents);
            }

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: $auditAction,
                subjectType: 'application_document',
                subjectId: $document->id,
                actor: $actor,
                actorType: $actor ? AuditActorType::User : AuditActorType::System,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'application_id' => $application->id,
                    'document_type' => $documentType->value,
                    'mime_type' => $mimeType,
                    'byte_size' => $byteSize,
                    'archived_previous_documents' => $archivedCount,
                    'archived_signed_authorizations' => $archivedSigned,
                ],
                occurredAt: $uploadedAt,
            );

            return $document;
        });
    }
}
