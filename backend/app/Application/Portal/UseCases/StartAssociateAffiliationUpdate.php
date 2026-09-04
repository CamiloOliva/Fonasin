<?php

namespace App\Application\Portal\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Portal\Exceptions\CannotViewPortalAffiliation;
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
    ) {}

    public function __invoke(
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): AffiliationApplication {
        $associate = $actor->associate;

        if (! $associate) {
            throw CannotViewPortalAffiliation::associateAccountIsMissing();
        }

        $sourceApplication = $associate->affiliationApplications()
            ->with('sections')
            ->where('status', AffiliationApplicationStatus::Enabled->value)
            ->latest('updated_at')
            ->first();

        if (! $sourceApplication) {
            throw CannotViewPortalAffiliation::enabledApplicationIsMissing();
        }

        return DB::transaction(function () use ($actor, $associate, $sourceApplication, $correlationId, $ipHash): AffiliationApplication {
            $draft = $associate->affiliationApplications()
                ->where('status', AffiliationApplicationStatus::Draft->value)
                ->latest('updated_at')
                ->first();

            if (! $draft) {
                $draft = AffiliationApplication::query()->create([
                    'associate_id' => $associate->id,
                    'status' => AffiliationApplicationStatus::Draft->value,
                    'current_step' => AffiliationApplicationStep::Personal->value,
                ]);
            }

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

            $draft->forceFill([
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
                    'source_application_id' => $sourceApplication->id,
                ],
            );

            return $draft->load('sections', 'documents', 'consentRecords');
        });
    }
}
