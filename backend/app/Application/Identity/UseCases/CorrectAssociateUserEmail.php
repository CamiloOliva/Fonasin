<?php

namespace App\Application\Identity\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\User;
use DomainException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CorrectAssociateUserEmail
{
    public function __construct(private readonly RecordAuditEvent $audit) {}

    public function __invoke(string $userId, string $email, string $expectedEmail, User $actor, string $correlationId, ?string $ipHash): void
    {
        try {
            DB::transaction(function () use ($userId, $email, $expectedEmail, $actor, $correlationId, $ipHash): void {
                $user = User::query()->lockForUpdate()->findOrFail($userId);
                if (! $user->hasRole('associate') || $user->hasAnyRole(['admin', 'reviewer'])) {
                    throw new DomainException('Solo se puede corregir el correo de una cuenta de asociado sin roles administrativos.');
                }
                if (strcasecmp($user->email, $expectedEmail) !== 0) {
                    throw new DomainException('El correo fue modificado por otra persona. Actualiza el listado antes de continuar.');
                }
                if (strcasecmp($user->email, $email) === 0) {
                    throw new DomainException('El nuevo correo debe ser diferente del actual.');
                }
                if (User::query()->where('email', $email)->whereKeyNot($user->id)->exists()) {
                    throw ValidationException::withMessages(['email' => 'El correo ya pertenece a otra cuenta.']);
                }
                DB::table('password_reset_tokens')->whereIn('email', [$user->email, $email])->delete();
                DB::table('sessions')->where('user_id', $user->id)->delete();
                $user->forceFill([
                    'email' => $email,
                    'email_verified_at' => null,
                    'remember_token' => null,
                    'status' => 'inactive',
                    'must_change_password' => true,
                    // Invalidates the old password and sessions rewritten by in-flight requests.
                    'password' => Hash::make(Str::random(64)),
                ])->save();
                ($this->audit)(
                    module: AuditModule::Identity,
                    action: 'user.email_corrected',
                    subjectType: 'user',
                    subjectId: $user->id,
                    actor: $actor,
                    actorType: AuditActorType::User,
                    correlationId: $correlationId,
                    ipHash: $ipHash,
                    metadata: ['sessions_revoked' => true, 'access_link_required' => true],
                );
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => 'El correo ya pertenece a otra cuenta.']);
        }
    }
}
