<?php

namespace App\Http\Controllers;

use App\Application\Affiliation\UseCases\CreateAssociateManually;
use App\Application\Affiliation\UseCases\UpdateAssociateStatus;
use App\Http\Requests\Associates\StoreAssociateRequest;
use App\Models\Associate;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssociateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $associates = Associate::query()
            ->with('user:id,email,status')
            ->withCount(['affiliationApplications', 'creditAccounts'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $associates->map(fn (Associate $associate): array => $this->associatePayload($associate))->values(),
        ]);
    }

    public function store(
        StoreAssociateRequest $request,
        CreateAssociateManually $createAssociate,
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
                ...$this->associatePayload($associate->load('user')->loadCount(['affiliationApplications', 'creditAccounts'])),
                'temporary_password' => $result['temporary_password'],
            ],
        ], 201);
    }

    public function activate(
        Request $request,
        Associate $associate,
        UpdateAssociateStatus $updateAssociateStatus,
    ): JsonResponse {
        return $this->changeStatus($request, $associate, $updateAssociateStatus, 'active');
    }

    public function deactivate(
        Request $request,
        Associate $associate,
        UpdateAssociateStatus $updateAssociateStatus,
    ): JsonResponse {
        return $this->changeStatus($request, $associate, $updateAssociateStatus, 'inactive');
    }

    /**
     * @return array<string, mixed>
     */
    private function associatePayload(Associate $associate): array
    {
        return [
            'id' => $associate->id,
            'user_id' => $associate->user_id,
            'document_type' => $associate->document_type,
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
            'data' => $this->associatePayload($updated->load('user')->loadCount(['affiliationApplications', 'creditAccounts'])),
        ]);
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
