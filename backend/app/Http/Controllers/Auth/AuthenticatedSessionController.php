<?php

namespace App\Http\Controllers\Auth;

use App\Application\Identity\UseCases\RecordAuthEvent;
use App\Domain\Identity\Enums\AuthEventType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request, RecordAuthEvent $recordAuthEvent): JsonResponse
    {
        $email = Str::lower($request->string('email')->toString());
        $password = $request->string('password')->toString();
        $correlationId = (string) Str::uuid();
        $emailHash = hash('sha256', $email);
        $ipHash = $this->ipHash($request);
        $userAgentHash = $this->userAgentHash($request);
        $throttleKey = $this->throttleKey($email, $request);

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            ($recordAuthEvent)(
                eventType: AuthEventType::LoginFailed,
                emailHash: $emailHash,
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                correlationId: $correlationId,
                metadata: [
                    'reason' => 'rate_limited',
                    'available_in_seconds' => RateLimiter::availableIn($throttleKey),
                ],
            );

            return response()->json([
                'message' => 'Too many login attempts.',
            ], 429);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            ($recordAuthEvent)(
                eventType: AuthEventType::LoginFailed,
                emailHash: $emailHash,
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                correlationId: $correlationId,
                metadata: ['reason' => 'invalid_credentials'],
            );
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        if ($user->status !== 'active') {
            ($recordAuthEvent)(
                eventType: AuthEventType::LoginFailed,
                user: $user,
                emailHash: $emailHash,
                ipHash: $ipHash,
                userAgentHash: $userAgentHash,
                correlationId: $correlationId,
                metadata: ['reason' => 'inactive_user'],
            );
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'message' => 'User account is inactive.',
            ], 403);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        RateLimiter::clear($throttleKey);

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        ($recordAuthEvent)(
            eventType: AuthEventType::LoginSucceeded,
            user: $user,
            emailHash: $emailHash,
            ipHash: $ipHash,
            userAgentHash: $userAgentHash,
            correlationId: $correlationId,
            metadata: ['method' => 'password'],
        );

        return response()->json([
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'roles' => $user->roles()->pluck('name')->values(),
            ],
        ]);
    }

    public function destroy(Request $request, RecordAuthEvent $recordAuthEvent): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user) {
            ($recordAuthEvent)(
                eventType: AuthEventType::Logout,
                user: $user,
                emailHash: hash('sha256', Str::lower($user->email)),
                ipHash: $this->ipHash($request),
                userAgentHash: $this->userAgentHash($request),
                metadata: ['method' => 'session'],
            );
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out.',
        ]);
    }

    private function ipHash(Request $request): ?string
    {
        $ip = $request->ip();

        return $ip ? hash('sha256', $ip) : null;
    }

    private function userAgentHash(Request $request): ?string
    {
        $userAgent = $request->userAgent();

        return $userAgent ? hash('sha256', $userAgent) : null;
    }

    private function throttleKey(string $email, Request $request): string
    {
        return 'login|'.$email.'|'.$request->ip();
    }
}
