<?php

namespace App\Http\Controllers;

use App\Application\Portal\UseCases\ViewAssociateAccountStatement;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\CreditAccount;
use App\Models\User;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalAccountStatementController extends Controller
{
    public function show(
        Request $request,
        ViewAssociateAccountStatement $viewAccountStatement,
        HashesSensitiveData $hasher,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        try {
            $statement = $viewAccountStatement($user, $this->ipHash($request, $hasher));
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => [
                'state' => $statement['state'],
                'generated_at' => $statement['generated_at'],
                'associate' => [
                    'id' => $user->associate?->id,
                    'full_name' => $user->associate?->full_name,
                    'document_type' => $user->associate?->document_type,
                    'status' => $user->associate?->status,
                ],
                'credits' => [
                    'state' => $statement['credits']['state'],
                    'total_current_balance' => $statement['credits']['items']->sum(
                        fn (CreditAccount $credit): float => (float) $credit->current_balance,
                    ),
                    'items' => $statement['credits']['items']
                        ->map(fn (CreditAccount $credit): array => $this->creditPayload($credit))
                        ->values(),
                ],
                'contributions' => [
                    'state' => $statement['contributions']['state'],
                    'account' => $statement['contributions']['account']
                        ? $this->accountPayload($statement['contributions']['account'])
                        : null,
                    'movements' => $statement['contributions']['movements']
                        ->map(fn (ContributionMovement $movement): array => $this->movementPayload($movement))
                        ->values(),
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function creditPayload(CreditAccount $credit): array
    {
        return [
            'id' => $credit->id,
            'credit_line' => $credit->credit_line,
            'initial_balance' => $credit->initial_balance,
            'current_balance' => $credit->current_balance,
            'term_months' => $credit->term_months,
            'interest_rate' => $credit->interest_rate,
            'installment_amount' => $credit->installment_amount,
            'last_payment_date' => $credit->last_payment_date?->toDateString(),
            'status' => $credit->status,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function accountPayload(ContributionAccount $account): array
    {
        return [
            'id' => $account->id,
            'contribution_balance' => $account->contribution_balance,
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
            'period' => $movement->period?->toDateString(),
            'cut_off_date' => $movement->cut_off_date?->toDateString(),
            'amount' => $movement->amount,
            'balance_after' => $movement->balance_after,
            'status' => $movement->status,
            'source' => $movement->source,
            'reference' => $movement->reference,
            'recorded_at' => $movement->recorded_at?->toISOString(),
        ];
    }

    private function domainError(DomainException $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage(),
        ], 422);
    }

    private function ipHash(Request $request, HashesSensitiveData $hasher): ?string
    {
        $ip = $request->ip();

        return $ip ? $hasher->ip($ip) : null;
    }
}
