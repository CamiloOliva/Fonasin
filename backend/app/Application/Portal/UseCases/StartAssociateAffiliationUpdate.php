<?php

namespace App\Application\Portal\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Portal\Exceptions\CannotViewPortalAffiliation;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationPurpose;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StartAssociateAffiliationUpdate
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
        private readonly EncryptsSensitiveData $cipher,
    ) {}

    public function __invoke(
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): AffiliationApplication {
        return DB::transaction(function () use ($actor, $correlationId, $ipHash): AffiliationApplication {
            $associate = $actor->associate()->lockForUpdate()->first();

            if (! $associate) {
                throw CannotViewPortalAffiliation::associateAccountIsMissing();
            }

            if ($associate->status !== 'active') {
                throw CannotViewPortalAffiliation::associateAccountIsInactive();
            }

            $sourceApplication = $associate->affiliationApplications()
                ->with('sections')
                ->where('status', AffiliationApplicationStatus::Enabled->value)
                ->latest('updated_at')
                ->first();

            $purpose = $sourceApplication
                ? AffiliationApplicationPurpose::DataUpdate
                : AffiliationApplicationPurpose::ProfileCompletion;

            $draft = $associate->affiliationApplications()
                ->where('status', AffiliationApplicationStatus::Draft->value)
                ->where('purpose', $purpose->value)
                ->latest('updated_at')
                ->first();

            if (! $draft) {
                $draft = AffiliationApplication::query()->create([
                    'associate_id' => $associate->id,
                    'purpose' => $purpose->value,
                    'source_application_id' => $sourceApplication?->id,
                    'status' => AffiliationApplicationStatus::Draft->value,
                    'current_step' => AffiliationApplicationStep::Personal->value,
                ]);
            }

            if ($sourceApplication) {
                foreach ($sourceApplication->sections as $sourceSection) {
                    $draftSection = ApplicationSection::query()->firstOrNew([
                        'application_id' => $draft->id,
                        'section' => $sourceSection->section,
                    ]);

                    $draftSection->forceFill([
                        'schema_version' => $sourceSection->schema_version,
                        'data_encrypted' => $sourceSection->getAttribute('data_encrypted'),
                        'completed_at' => null,
                    ])->save();
                }
            } else {
                $this->prefillImportedAssociateIdentity($draft, $associate->document_type, $associate->getAttribute('document_number_encrypted'), $actor->email);
            }

            $draft->forceFill([
                'source_application_id' => $sourceApplication?->id,
                'current_step' => AffiliationApplicationStep::Personal->value,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Portal,
                action: AffiliationAuditAction::ApplicationUpdateDraftCreated->value,
                subjectType: 'affiliation_application',
                subjectId: $draft->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId ?? (string) Str::uuid(),
                ipHash: $ipHash,
                metadata: [
                    'associate_id' => $associate->id,
                    'purpose' => $purpose->value,
                    'source_application_id' => $sourceApplication?->id,
                ],
            );

            return $draft->load('sections', 'documents', 'consentRecords');
        });
    }

    private function prefillImportedAssociateIdentity(
        AffiliationApplication $draft,
        string $documentType,
        mixed $encryptedDocument,
        string $email,
    ): void {
        $documentNumber = '';

        if (is_string($encryptedDocument) && $encryptedDocument !== '') {
            $documentNumber = (string) ($this->cipher->decryptArray($encryptedDocument)['document_number'] ?? '');
        }

        $section = ApplicationSection::query()->firstOrNew([
            'application_id' => $draft->id,
            'section' => AffiliationApplicationStep::Personal->value,
        ]);

        $section->forceFill([
            'schema_version' => 1,
            'data_encrypted' => $this->cipher->encryptArray([
                'documentType' => $documentType,
                'documentNumber' => $documentNumber,
                'email' => $email,
            ]),
            'completed_at' => null,
        ])->save();
    }
}
