<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotManageAssociate;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateAssociateManually
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly HashesSensitiveData $hasher,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array{document_type: string, document_number: string, full_name: string, email: string, status?: string}  $data
     * @return array{associate: Associate, user: User, activation_required: bool}
     */
    public function __invoke(
        array $data,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): array {
        return DB::transaction(function () use ($data, $actor, $correlationId, $ipHash): array {
            $documentNumber = strtoupper(trim($data['document_number']));
            $documentNumberHash = $this->hasher->documentNumber($documentNumber);

            if (Associate::query()->where('document_number_hash', $documentNumberHash)->exists()) {
                throw CannotManageAssociate::duplicateDocument();
            }

            $status = $data['status'] ?? 'active';

            if (! in_array($status, ['active', 'inactive'], true)) {
                throw CannotManageAssociate::invalidStatus($status);
            }

            $email = Str::lower(trim($data['email']));
            $user = User::query()->where('email', $email)->first();
            $userWithSameDocument = User::query()
                ->where('document_number_hash', $documentNumberHash)
                ->where('email', '!=', $email)
                ->first();

            if ($userWithSameDocument) {
                throw CannotManageAssociate::identityConflict();
            }

            if ($user && Associate::query()->where('user_id', $user->id)->exists()) {
                throw CannotManageAssociate::userAlreadyLinked();
            }

            if ($user && is_string($user->document_number_hash) && $user->document_number_hash !== $documentNumberHash) {
                throw CannotManageAssociate::identityConflict();
            }

            $activationRequired = false;

            if (! $user) {
                $activationRequired = true;

                $user = User::query()->create([
                    'email' => $email,
                    'document_type' => $data['document_type'],
                    'document_number_hash' => $documentNumberHash,
                    'document_number_encrypted' => $this->cipher->encryptArray([
                        'document_number' => $documentNumber,
                    ]),
                    'password' => Str::password(40),
                    'must_change_password' => true,
                    'status' => 'active',
                ]);
            }

            if (! is_string($user->document_number_hash) || $user->document_number_hash === '') {
                $user->forceFill([
                    'document_type' => $data['document_type'],
                    'document_number_hash' => $documentNumberHash,
                    'document_number_encrypted' => $this->cipher->encryptArray([
                        'document_number' => $documentNumber,
                    ]),
                ])->save();
            }

            $associateRole = Role::query()->firstOrCreate(['name' => 'associate']);

            if (! $user->roles()->whereKey($associateRole->id)->exists()) {
                $user->roles()->attach($associateRole, ['created_at' => now()]);
            }

            $associate = Associate::query()->create([
                'user_id' => $user->id,
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
                    'user_id' => $user->id,
                ],
            );

            return [
                'associate' => $associate->refresh(),
                'user' => $user->refresh(),
                'activation_required' => $activationRequired || $user->must_change_password,
            ];
        });
    }
}
