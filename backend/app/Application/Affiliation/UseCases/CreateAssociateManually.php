<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotManageAssociate;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateAssociateManually
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array{document_type: string, document_number: string, full_name: string, status?: string}  $data
     */
    public function __invoke(
        array $data,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): Associate {
        return DB::transaction(function () use ($data, $actor, $correlationId, $ipHash): Associate {
            $documentNumber = strtoupper(trim($data['document_number']));
            $documentNumberHash = hash('sha256', $documentNumber);

            if (Associate::query()->where('document_number_hash', $documentNumberHash)->exists()) {
                throw CannotManageAssociate::duplicateDocument();
            }

            $status = $data['status'] ?? 'active';

            if (! in_array($status, ['active', 'inactive'], true)) {
                throw CannotManageAssociate::invalidStatus($status);
            }

            $associate = Associate::query()->create([
                'document_type' => $data['document_type'],
                'document_number_hash' => $documentNumberHash,
                'document_number_encrypted' => $this->cipher->encryptArray([
                    'document_number' => $documentNumber,
                ]),
                'full_name' => trim($data['full_name']),
                'status' => $status,
            ]);

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::AssociateCreated->value,
                subjectType: 'associate',
                subjectId: $associate->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId ?? (string) Str::uuid(),
                ipHash: $ipHash,
                metadata: [
                    'document_type' => $associate->document_type,
                    'status' => $associate->status,
                ],
            );

            return $associate->refresh();
        });
    }
}
