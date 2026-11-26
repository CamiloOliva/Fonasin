<?php

namespace App\Application\Identity\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Identity\Exceptions\CannotSendAssociateActivation;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Identity\Enums\IdentityAuditAction;
use App\Mail\AssociateActivationMail;
use App\Models\Associate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendAssociateActivationLink
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(Associate $associate, User $actor, ?string $ipHash = null): void
    {
        DB::transaction(function () use ($associate, $actor, $ipHash): void {
            $associate = Associate::query()->lockForUpdate()->findOrFail($associate->id);
            $associate->loadMissing('user.roles');
            $user = $associate->user;

            if (
                ! $user
                || ! $user->hasRole('associate')
                || $associate->status !== 'active'
                || $user->status !== 'active'
                || ! $user->must_change_password
            ) {
                throw CannotSendAssociateActivation::unavailable();
            }

            $token = Str::random(64);
            $expiresInMinutes = (int) config('auth.passwords.users.expire', 60);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()],
            );

            Mail::to($user->email)->send(new AssociateActivationMail(
                activationUrl: $this->activationUrl($user->email, $token),
                expiresInMinutes: $expiresInMinutes,
            ));

            ($this->recordAuditEvent)(
                module: AuditModule::Identity,
                action: IdentityAuditAction::AssociateActivationSent->value,
                subjectType: 'associate',
                subjectId: $associate->id,
                actor: $actor,
                actorType: AuditActorType::User,
                ipHash: $ipHash,
                metadata: ['channel' => 'email', 'expires_in_minutes' => $expiresInMinutes],
            );
        });
    }

    private function activationUrl(string $email, string $token): string
    {
        $frontendUrl = rtrim((string) config('services.frontend.url'), '/');

        return $frontendUrl.'/recuperar-contrasena?'.http_build_query([
            'email' => $email,
            'token' => $token,
            'activation' => '1',
        ]);
    }
}
