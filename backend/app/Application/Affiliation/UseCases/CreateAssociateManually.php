<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotManageAssociate;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
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
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array{document_type: string, document_number: string, full_name: string, email: string, password?: string|null, status?: string}  $data
     * @return array{associate: Associate, user: User, temporary_password: string|null}
     */
    public function __invoke(
        array $data,
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): array {
        return DB::transaction(function () use ($data, $actor, $correlationId, $ipHash): array {
            $documentNumber = strtoupper(trim($data['document_number']));
            $documentNumberHash = hash('sha256', $documentNumber);

            if (Associate::query()->where('document_number_hash', $documentNumberHash)->exists()) {
                throw CannotManageAssociate::duplicateDocument();
            }

            $status = $data['status'] ?? 'active';

            if (! in_array($status, ['active', 'inactive'], true)) {
                throw CannotManageAssociate::invalidStatus($status);
            }

            $email = Str::lower(trim($data['email']));
            $user = User::query()->where('email', $email)->first();

            if ($user && Associate::query()->where('user_id', $user->id)->exists()) {
                throw CannotManageAssociate::userAlreadyLinked();
            }

            $temporaryPassword = null;

            if (! $user) {
                $temporaryPassword = filled($data['password'] ?? null)
                    ? null
                    : Str::password(14, letters: true, numbers: true, symbols: false, spaces: false);
                $password = filled($data['password'] ?? null) ? $data['password'] : $temporaryPassword;

                $user = User::query()->create([
                    'email' => $email,
                    'password' => $password,
                    'must_change_password' => true,
                    'status' => 'active',
                ]);
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
                'temporary_password' => $temporaryPassword,
            ];
        });
    }
}
