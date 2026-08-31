<?php

namespace App\Http\Controllers;

use App\Application\Affiliation\UseCases\CreateAssociateManually;
use App\Application\Affiliation\UseCases\UpdateAssociateStatus;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Http\Requests\Associates\StoreAssociateRequest;
use App\Models\Associate;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AssociateController extends Controller
{
    public function index(Request $request, EncryptsSensitiveData $cipher): JsonResponse
    {
        $associates = Associate::query()
            ->with('user:id,email,status')
            ->withCount(['affiliationApplications', 'creditAccounts'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $associates->map(fn (Associate $associate): array => $this->associatePayload($associate, $cipher))->values(),
        ]);
    }

    public function store(
        StoreAssociateRequest $request,
        CreateAssociateManually $createAssociate,
        EncryptsSensitiveData $cipher,
    ): JsonResponse {
        try {
            $result = $createAssociate(
                data: $request->validated(),
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        $associate = $result['associate'];

        return response()->json([
            'data' => [
                ...$this->associatePayload($associate->load('user')->loadCount(['affiliationApplications', 'creditAccounts']), $cipher),
                'temporary_password' => $result['temporary_password'],
            ],
        ], 201);
    }

    public function activate(
        Request $request,
        Associate $associate,
        UpdateAssociateStatus $updateAssociateStatus,
        EncryptsSensitiveData $cipher,
    ): JsonResponse {
        return $this->changeStatus($request, $associate, $updateAssociateStatus, $cipher, 'active');
    }

    public function deactivate(
        Request $request,
        Associate $associate,
        UpdateAssociateStatus $updateAssociateStatus,
        EncryptsSensitiveData $cipher,
    ): JsonResponse {
        return $this->changeStatus($request, $associate, $updateAssociateStatus, $cipher, 'inactive');
    }

    /**
     * @return array<string, mixed>
     */
    private function associatePayload(Associate $associate, EncryptsSensitiveData $cipher): array
    {
        return [
            'id' => $associate->id,
            'user_id' => $associate->user_id,
            'document_type' => $associate->document_type,
            'document_number_masked' => $this->maskedDocumentNumber($associate, $cipher),
            'full_name' => $associate->full_name,
            'status' => $associate->status,
            'user' => $associate->user ? [
                'id' => $associate->user->id,
                'email' => $associate->user->email,
                'status' => $associate->user->status,
            ] : null,
            'affiliation_applications_count' => $associate->affiliation_applications_count ?? 0,
            'credit_accounts_count' => $associate->credit_accounts_count ?? 0,
            'created_at' => $associate->created_at?->toJSON(),
            'updated_at' => $associate->updated_at?->toJSON(),
        ];
    }

    private function changeStatus(
        Request $request,
        Associate $associate,
        UpdateAssociateStatus $updateAssociateStatus,
        EncryptsSensitiveData $cipher,
        string $status,
    ): JsonResponse {
        try {
            $updated = $updateAssociateStatus(
                associate: $associate,
                status: $status,
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->associatePayload(
                $updated->load('user')->loadCount(['affiliationApplications', 'creditAccounts']),
                $cipher,
            ),
        ]);
    }

    private function maskedDocumentNumber(Associate $associate, EncryptsSensitiveData $cipher): string
    {
        $encrypted = $associate->getAttribute('document_number_encrypted');

        if (! is_string($encrypted) || $encrypted === '') {
            return 'No disponible';
        }

        try {
            $payload = $cipher->decryptArray($encrypted);
        } catch (Throwable) {
            return 'No disponible';
        }

        $documentNumber = $payload['document_number'] ?? null;

        if (! is_string($documentNumber) || trim($documentNumber) === '') {
            return 'No disponible';
        }

        $normalized = trim($documentNumber);
        $visible = substr($normalized, -4);

        return str_repeat('*', max(strlen($normalized) - strlen($visible), 0)).$visible;
    }

    private function domainError(DomainException $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage(),
        ], 422);
    }

    private function ipHash(Request $request): ?string
    {
        $ip = $request->ip();

        return $ip ? hash('sha256', $ip) : null;
    }
}
