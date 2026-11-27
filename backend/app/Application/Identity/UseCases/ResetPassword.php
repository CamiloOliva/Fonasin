<?php

namespace App\Application\Identity\UseCases;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Identity\Enums\AuthEventType;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ResetPassword
{
    public function __construct(
        private readonly RecordAuthEvent $recordAuthEvent,
        private readonly HashesSensitiveData $hasher,
        private readonly ResolvePasswordLinkLifetime $linkLifetime,
        private readonly LockPasswordRecoveryUser $lockUser,
    ) {}

    public function __invoke(
        string $email,
        string $token,
        string $password,
        ?string $ipHash = null,
        ?string $userAgentHash = null,
    ): User {
        $email = Str::lower(trim($email));

        return DB::transaction(function () use ($email, $token, $password, $ipHash, $userAgentHash): User {
            // Always lock the user before its tokens, as email correction does.
            $user = ($this->lockUser)($email);
            if (! $user) {
                throw ValidationException::withMessages([
                    'token' => ['El enlace de recuperacion no es valido o ya expiro.'],
                ]);
            }
            $record = DB::table('password_reset_tokens')->where('email', $email)->lockForUpdate()->first();

            $createdAt = $record ? Carbon::parse($record->created_at) : null;
            $expiresAt = $createdAt?->copy()->addMinutes(($this->linkLifetime)($user));
            if (! $record || ! $createdAt || $createdAt->isFuture() || $expiresAt->lte(now()) || ! Hash::check($token, $record->token)) {
                throw ValidationException::withMessages([
                    'token' => ['El enlace de recuperacion no es valido o ya expiro.'],
                ]);
            }

            if ($user->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['No fue posible actualizar la contrasena.'],
                ]);
            }

            $user->forceFill([
                'password' => $password,
                'must_change_password' => false,
                'remember_token' => Str::random(60),
            ])->save();

            DB::table('password_reset_tokens')->where('email', $email)->delete();
            DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
                ->where('user_id', $user->id)->delete();

            ($this->recordAuthEvent)(
                eventType: AuthEventType::PasswordResetCompleted,
                user: $user,
                emailHash: $this->hasher->email($email),
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                metadata: ['method' => 'email_token', 'sessions_revoked' => true],
            );

            return $user->refresh();
        });
    }
}
