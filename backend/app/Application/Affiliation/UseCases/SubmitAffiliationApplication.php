<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotSubmitAffiliationApplication;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Support\AffiliationApplicationStateMachine;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubmitAffiliationApplication
{
    public function __construct(
        private readonly AffiliationApplicationStateMachine $stateMachine,
        private readonly VerifyRequiredSections $verifyRequiredSections,
        private readonly VerifyRequiredDocuments $verifyRequiredDocuments,
        private readonly VerifyRequiredConsents $verifyRequiredConsents,
        private readonly GenerateAffiliationSubmissionDocuments $generateDocuments,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(
        AffiliationApplication $application,
        string $policyVersion,
        ?User $actor = null,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $submittedAt = null,
        ?string $signatureCity = null,
        ?string $signatureDate = null,
    ): AffiliationApplication {
        return DB::transaction(function () use ($application, $policyVersion, $actor, $correlationId, $ipHash, $submittedAt, $signatureCity, $signatureDate) {
            $application->refresh();
            $fromStatus = AffiliationApplicationStatus::from($application->status);
            $toStatus = AffiliationApplicationStatus::Submitted;

            if (! $this->stateMachine->canTransition($fromStatus, $toStatus)) {
                throw CannotSubmitAffiliationApplication::invalidStatus($fromStatus);
            }

            $missingSections = $this->verifyRequiredSections->missingSections($application);

            if ($missingSections !== []) {
                throw CannotSubmitAffiliationApplication::missingSections($missingSections);
            }

            $missingDocuments = $this->verifyRequiredDocuments->missingDocumentTypes($application);

            if ($missingDocuments !== []) {
                throw CannotSubmitAffiliationApplication::missingDocuments($missingDocuments);
            }

            $missingConsents = $this->verifyRequiredConsents->missingConsentTypes($application, $policyVersion);

            if ($missingConsents !== []) {
                throw CannotSubmitAffiliationApplication::missingConsents($missingConsents);
            }

            $submittedAt ??= now();
            $correlationId ??= (string) Str::uuid();

            ($this->generateDocuments)(
                application: $application,
                actor: $actor,
                correlationId: $correlationId,
                ipHash: $ipHash,
                generatedAt: $submittedAt,
                signatureCity: $signatureCity,
                signatureDate: $signatureDate,
            );

            $application->forceFill([
                'status' => $toStatus->value,
                'current_step' => AffiliationApplicationStep::Summary->value,
                'submitted_at' => $submittedAt,
                'access_token_hash' => null,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::ApplicationSubmitted->value,
                subjectType: 'affiliation_application',
                subjectId: $application->id,
                actor: $actor,
                actorType: $actor ? AuditActorType::User : AuditActorType::System,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'status' => [
                        'from' => $fromStatus->value,
                        'to' => $toStatus->value,
                    ],
                    'policy_version' => $policyVersion,
                ],
                occurredAt: $submittedAt,
            );

            return $application->refresh();
        });
    }
}
