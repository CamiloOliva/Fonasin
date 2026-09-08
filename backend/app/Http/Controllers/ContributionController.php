<?php

namespace App\Http\Controllers;

use App\Application\Contributions\UseCases\ViewAssociateContributions;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    public function mine(Request $request, ViewAssociateContributions $viewAssociateContributions): JsonResponse
    {
        try {
            $result = $viewAssociateContributions(
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => [
                'state' => $result['state'],
                'account' => $result['account'] ? $this->accountPayload($result['account']) : null,
                'movements' => $result['movements']
                    ->map(fn (ContributionMovement $movement): array => $this->movementPayload($movement))
                    ->values(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function accountPayload(ContributionAccount $account): array
    {
        return [
            'id' => $account->id,
            'associate_id' => $account->associate_id,
            'permanent_savings_balance' => $account->permanent_savings_balance,
            'voluntary_savings_balance' => $account->voluntary_savings_balance,
            'total_balance' => $account->total_balance,
            'status' => $account->status,
            'last_period' => $account->last_period?->toDateString(),
            'last_cut_off_date' => $account->last_cut_off_date?->toDateString(),
            'last_movement_at' => $account->last_movement_at?->toISOString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function movementPayload(ContributionMovement $movement): array
    {
        return [
            'id' => $movement->id,
            'movement_type' => $movement->movement_type,
            'period' => $movement->period->toDateString(),
            'cut_off_date' => $movement->cut_off_date->toDateString(),
            'amount' => $movement->amount,
            'balance_after' => $movement->balance_after,
            'status' => $movement->status,
            'source' => $movement->source,
            'reference' => $movement->reference,
            'recorded_at' => $movement->recorded_at->toISOString(),
        ];
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

        return $ip ? app(HashesSensitiveData::class)->ip($ip) : null;
    }
}
