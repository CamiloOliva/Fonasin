<?php

namespace App\Application\Identity\UseCases;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Identity\Enums\AuthEventType;
use App\Mail\PasswordResetLinkMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RequestPasswordReset
{
    public function __construct(
        private readonly RecordAuthEvent $recordAuthEvent,
        private readonly HashesSensitiveData $hasher,
        private readonly ResolvePasswordLinkLifetime $linkLifetime,
        private readonly LockPasswordRecoveryUser $lockUser,
    ) {}

    public function __invoke(
        string $email,
        string $documentNumber,
        ?string $ipHash = null,
        ?string $userAgentHash = null,
    ): void {
        $email = Str::lower(trim($email));
        $documentHash = $this->hasher->documentNumber($documentNumber);
        $correlationId = (string) Str::uuid();

        DB::transaction(function () use ($email, $documentHash, $correlationId, $ipHash, $userAgentHash): void {

            /** @var User|null $user */
            $user = ($this->lockUser)($email);
            if ($user && $user->status !== 'active') {
                $user = null;
            }
            $user?->load('associate:id,user_id,document_number_hash,status');

            $matchesDocument = $user && (
                $user->document_number_hash === $documentHash
                || $user->associate?->document_number_hash === $documentHash
            );
            $canResetPassword = (bool) $matchesDocument
                && (! $user->associate || $user->associate->status === 'active');

            ($this->recordAuthEvent)(
                eventType: AuthEventType::PasswordResetRequested,
                user: $canResetPassword ? $user : null,
                emailHash: $this->hasher->email($email),
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                correlationId: $correlationId,
                metadata: [
                    'matched_account' => (bool) $matchesDocument,
                    'eligible_account' => $canResetPassword,
                ],
            );

            if (! $canResetPassword) {
                return;
            }

            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ],
            );

            Mail::to($email)->send(new PasswordResetLinkMail(
                resetUrl: $this->resetUrl($email, $token),
                expiresInMinutes: ($this->linkLifetime)($user),
            ));
        });
    }

    private function resetUrl(string $email, string $token): string
    {
        $frontendUrl = rtrim((string) config('services.frontend.url'), '/');

        return $frontendUrl.'/recuperar-contrasena?'.http_build_query([
            'email' => $email,
            'token' => $token,
        ]);
    }
}
