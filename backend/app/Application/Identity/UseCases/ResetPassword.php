<?php

namespace App\Application\Identity\UseCases;

use App\Domain\Identity\Enums\AuthEventType;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ResetPassword
{
    public function __construct(private readonly RecordAuthEvent $recordAuthEvent) {}

    public function __invoke(
        string $email,
        string $token,
        string $password,
        ?string $ipHash = null,
        ?string $userAgentHash = null,
    ): User {
        $email = Str::lower(trim($email));

        return DB::transaction(function () use ($email, $token, $password, $ipHash, $userAgentHash): User {
            $record = DB::table('password_reset_tokens')->where('email', $email)->first();

            if (! $record || ! Hash::check($token, $record->token) || now()->diffInMinutes(Carbon::parse($record->created_at)) > 60) {
                throw ValidationException::withMessages([
                    'token' => ['El enlace de recuperacion no es valido o ya expiro.'],
                ]);
            }

            /** @var User|null $user */
            $user = User::query()
                ->where('email', $email)
                ->where('status', 'active')
                ->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'email' => ['No fue posible actualizar la contrasena.'],
                ]);
            }

            $user->forceFill([
                'password' => $password,
                'must_change_password' => false,
            ])->save();

            DB::table('password_reset_tokens')->where('email', $email)->delete();

            ($this->recordAuthEvent)(
                eventType: AuthEventType::PasswordResetCompleted,
                user: $user,
                emailHash: hash('sha256', $email),
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                metadata: ['method' => 'email_token'],
            );

            return $user->refresh();
        });
    }
}
