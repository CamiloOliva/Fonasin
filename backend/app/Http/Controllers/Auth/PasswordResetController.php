<?php

namespace App\Http\Controllers\Auth;

use App\Application\Identity\UseCases\RequestPasswordReset;
use App\Application\Identity\UseCases\ResetPassword;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function store(
        ForgotPasswordRequest $request,
        RequestPasswordReset $requestPasswordReset,
        HashesSensitiveData $hasher,
    ): JsonResponse
    {
        $email = Str::lower($request->string('email')->toString());
        $throttleKey = 'password-reset|'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return response()->json([
                'message' => 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 300);

        $requestPasswordReset(
            email: $email,
            documentNumber: $request->string('document_number')->toString(),
            ipHash: $this->ipHash($request, $hasher),
            userAgentHash: $this->userAgentHash($request, $hasher),
        );

        return response()->json([
            'message' => 'Si los datos coinciden, enviaremos un enlace temporal al correo registrado.',
        ]);
    }

    public function update(
        ResetPasswordRequest $request,
        ResetPassword $resetPassword,
        HashesSensitiveData $hasher,
    ): JsonResponse
    {
        $resetPassword(
            email: $request->string('email')->toString(),
            token: $request->string('token')->toString(),
            password: $request->string('password')->toString(),
            ipHash: $this->ipHash($request, $hasher),
            userAgentHash: $this->userAgentHash($request, $hasher),
        );

        return response()->json([
            'message' => 'Contrasena actualizada correctamente.',
        ]);
    }

    private function ipHash(Request $request, HashesSensitiveData $hasher): ?string
    {
        $ip = $request->ip();

        return $ip ? $hasher->ip($ip) : null;
    }

    private function userAgentHash(Request $request, HashesSensitiveData $hasher): ?string
    {
        $userAgent = $request->userAgent();

        return $userAgent ? $hasher->userAgent($userAgent) : null;
    }
}
