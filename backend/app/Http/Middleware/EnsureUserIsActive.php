<?php

namespace App\Http\Middleware;

use App\Application\Identity\UseCases\RecordAuthEvent;
use App\Domain\Identity\Enums\AuthEventType;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || $user->status === 'active') {
            return $next($request);
        }

        // Login validation alone cannot revoke a session already in use.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        app(RecordAuthEvent::class)(
            eventType: AuthEventType::Logout,
            user: $user,
            metadata: ['reason' => 'inactive_session'],
        );

        return response()->json(['message' => 'User account is inactive.'], 403);
    }
}
