<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotReviewAffiliationApplication;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Support\AffiliationApplicationStateMachine;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnableAffiliationApplication
{
    public function __construct(
        private readonly AffiliationApplicationStateMachine $stateMachine,
        private readonly EncryptsSensitiveData $cipher,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @return array{application: AffiliationApplication, associate: Associate, user: User, temporary_password: ?string}
     */
    public function __invoke(
        AffiliationApplication $application,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $enabledAt = null,
    ): array {
        return DB::transaction(function () use ($application, $actor, $correlationId, $ipHash, $enabledAt): array {
            $application->refresh();
            $fromStatus = AffiliationApplicationStatus::from($application->status);
            $toStatus = AffiliationApplicationStatus::Enabled;

            if (! $this->stateMachine->canTransition($fromStatus, $toStatus)) {
                throw CannotReviewAffiliationApplication::invalidStatus($fromStatus, $toStatus);
            }

            $hasSignedPayrollAuthorization = $application->documents()
                ->where('document_type', ApplicationDocumentType::SignedPayrollAuthorization->value)
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->exists();

            if (! $hasSignedPayrollAuthorization) {
                throw CannotReviewAffiliationApplication::missingSignedPayrollAuthorization();
            }

            $personalData = $this->personalData($application);
            $documentType = $this->requiredString($personalData, 'documentType');
            $documentNumber = $this->requiredString($personalData, 'documentNumber');
            $email = $this->requiredString($personalData, 'email');
            $fullName = $this->fullName($personalData);
            $documentNumberHash = hash('sha256', strtoupper(trim($documentNumber)));

            $temporaryPassword = null;
            $user = User::query()->firstOrNew(['email' => strtolower(trim($email))]);

            if (! $user->exists) {
                $temporaryPassword = Str::random(16);
                $user->forceFill([
                    'password' => $temporaryPassword,
                    'must_change_password' => true,
                    'status' => 'active',
                    'email_verified_at' => now(),
                ])->save();
            }

            $associateRole = Role::query()->firstOrCreate(['name' => 'associate']);
            $user->roles()->syncWithoutDetaching([$associateRole->id]);

            $associate = Associate::query()->firstOrNew([
                'document_number_hash' => $documentNumberHash,
            ]);

            $associate->forceFill([
                'user_id' => $associate->user_id ?? $user->id,
                'document_type' => $documentType,
                'document_number_encrypted' => $this->cipher->encryptArray([
                    'document_number' => $documentNumber,
                ]),
                'full_name' => $fullName,
                'status' => 'active',
            ])->save();

            $enabledAt ??= now();
            $correlationId ??= (string) Str::uuid();

            $application->forceFill([
                'associate_id' => $associate->id,
                'status' => $toStatus->value,
                'reviewed_by_user_id' => $actor->id,
                'reviewed_at' => $enabledAt,
                'rejection_reason' => null,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Affiliation,
                action: AffiliationAuditAction::ApplicationEnabled->value,
                subjectType: 'affiliation_application',
                subjectId: $application->id,
                actor: $actor,
                actorType: AuditActorType::User,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'associate_id' => $associate->id,
                    'user_id' => $user->id,
                    'created_user' => $temporaryPassword !== null,
                    'status' => [
                        'from' => $fromStatus->value,
                        'to' => $toStatus->value,
                    ],
                ],
                occurredAt: $enabledAt,
            );

            return [
                'application' => $application->refresh(),
                'associate' => $associate->refresh(),
                'user' => $user->refresh(),
                'temporary_password' => $temporaryPassword,
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function personalData(AffiliationApplication $application): array
    {
        $section = $application->sections()
            ->where('section', AffiliationApplicationStep::Personal->value)
            ->first();

        $encryptedPayload = $section?->getAttribute('data_encrypted');

        if (! is_string($encryptedPayload)) {
            throw CannotReviewAffiliationApplication::missingPersonalSection();
        }

        return $this->cipher->decryptArray($encryptedPayload);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requiredString(array $data, string $field): string
    {
        $value = $data[$field] ?? null;

        if (! is_string($value) || trim($value) === '') {
            throw CannotReviewAffiliationApplication::missingPersonalField($field);
        }

        return trim($value);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function fullName(array $data): string
    {
        $names = [
            $this->requiredString($data, 'firstName'),
            is_string($data['middleName'] ?? null) ? trim($data['middleName']) : '',
            $this->requiredString($data, 'lastName'),
            is_string($data['secondLastName'] ?? null) ? trim($data['secondLastName']) : '',
        ];

        return trim(implode(' ', array_filter($names)));
    }
}
