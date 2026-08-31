<?php

namespace App\Http\Controllers\Auth;

use App\Application\Identity\UseCases\RequestPasswordReset;
use App\Application\Identity\UseCases\ResetPassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{
    public function store(ForgotPasswordRequest $request, RequestPasswordReset $requestPasswordReset): JsonResponse
    {
        $requestPasswordReset(
            email: $request->string('email')->toString(),
            documentNumber: $request->string('document_number')->toString(),
            ipHash: $this->ipHash($request),
            userAgentHash: $this->userAgentHash($request),
        );

        return response()->json([
            'message' => 'Si los datos coinciden, enviaremos un enlace temporal al correo registrado.',
        ]);
    }

    public function update(ResetPasswordRequest $request, ResetPassword $resetPassword): JsonResponse
    {
        $resetPassword(
            email: $request->string('email')->toString(),
            token: $request->string('token')->toString(),
            password: $request->string('password')->toString(),
            ipHash: $this->ipHash($request),
            userAgentHash: $this->userAgentHash($request),
        );

        return response()->json([
            'message' => 'Contrasena actualizada correctamente.',
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
}
