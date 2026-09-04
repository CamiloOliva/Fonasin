<?php

namespace App\Application\Portal\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Portal\Exceptions\CannotViewPortalAffiliation;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Support\Str;

class ViewAssociateAffiliation
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): ?AffiliationApplication {
        $associate = $actor->associate;

        if (! $associate) {
            throw CannotViewPortalAffiliation::associateAccountIsMissing();
        }

        $application = $associate->affiliationApplications()
            ->with(['documents' => fn ($query) => $query
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->where('document_type', ApplicationDocumentType::AffiliationSummary->value)
                ->oldest('created_at')])
            ->where('status', AffiliationApplicationStatus::Enabled->value)
            ->latest('updated_at')
            ->first();

        ($this->recordAuditEvent)(
            module: AuditModule::Portal,
            action: AffiliationAuditAction::ApplicationViewed->value,
            subjectType: 'associate',
            subjectId: $associate->id,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId ?? (string) Str::uuid(),
            ipHash: $ipHash,
            metadata: [
                'application_id' => $application?->id,
                'has_application' => $application !== null,
            ],
        );

        return $application;
    }
}
