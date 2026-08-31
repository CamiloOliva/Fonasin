<?php

namespace App\Application\Identity\UseCases;

use App\Domain\Identity\Enums\AuthEventType;
use App\Mail\PasswordResetLinkMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RequestPasswordReset
{
    public function __construct(private readonly RecordAuthEvent $recordAuthEvent) {}

    public function __invoke(
        string $email,
        string $documentNumber,
        ?string $ipHash = null,
        ?string $userAgentHash = null,
    ): void {
        $email = Str::lower(trim($email));
        $documentHash = hash('sha256', strtoupper(trim($documentNumber)));
        $correlationId = (string) Str::uuid();

        /** @var User|null $user */
        $user = User::query()
            ->with('associate:id,user_id,document_number_hash')
            ->where('email', $email)
            ->where('status', 'active')
            ->first();

        $matchesDocument = $user && (
            $user->document_number_hash === $documentHash
            || $user->associate?->document_number_hash === $documentHash
        );

        ($this->recordAuthEvent)(
            eventType: AuthEventType::PasswordResetRequested,
            user: $matchesDocument ? $user : null,
            emailHash: hash('sha256', $email),
            ipHash: $ipHash,
            userAgentHash: $userAgentHash,
            correlationId: $correlationId,
            metadata: [
                'matched_account' => (bool) $matchesDocument,
            ],
        );

        if (! $matchesDocument) {
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
            expiresInMinutes: 60,
        ));
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
