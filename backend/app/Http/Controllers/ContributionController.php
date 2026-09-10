<?php

namespace App\Http\Controllers;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\UseCases\ListContributionAccounts;
use App\Application\Contributions\UseCases\ListContributionMovements;
use App\Application\Contributions\UseCases\ViewAssociateContributions;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Http\Requests\Contributions\ListContributionAccountsRequest;
use App\Http\Requests\Contributions\ListContributionMovementsRequest;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    public function index(
        ListContributionAccountsRequest $request,
        ListContributionAccounts $listContributionAccounts,
        RecordAuditEvent $recordAuditEvent,
    ): JsonResponse {
        $filters = $request->safe()->only(['associate_id', 'status', 'period']);
        $accounts = $listContributionAccounts(
            filters: $filters,
            perPage: (int) $request->integer('per_page', 25),
        );

        ($recordAuditEvent)(
            module: AuditModule::Contributions,
            action: ContributionAuditAction::ContributionAccountCollectionViewed->value,
            subjectType: 'contribution_account_collection',
            subjectId: $request->user()->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: [
                'scope' => 'admin',
                'filters' => array_filter($filters),
                'count' => $accounts->count(),
                'total' => $accounts->total(),
                'per_page' => $accounts->perPage(),
            ],
        );

        return response()->json([
            'data' => $accounts->getCollection()
                ->map(fn (ContributionAccount $account): array => $this->accountPayload($account, true))
                ->values(),
            'meta' => $this->paginationPayload($accounts),
        ]);
    }

    public function movements(
        ListContributionMovementsRequest $request,
        ContributionAccount $account,
        ListContributionMovements $listContributionMovements,
        RecordAuditEvent $recordAuditEvent,
    ): JsonResponse {
        $filters = $request->safe()->only(['movement_type', 'status', 'period']);
        $movements = $listContributionMovements(
            account: $account,
            filters: $filters,
            perPage: (int) $request->integer('per_page', 25),
        );

        ($recordAuditEvent)(
            module: AuditModule::Contributions,
            action: ContributionAuditAction::ContributionMovementCollectionViewed->value,
            subjectType: 'contribution_account',
            subjectId: $account->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: [
                'scope' => 'admin',
                'filters' => array_filter($filters),
                'count' => $movements->count(),
                'total' => $movements->total(),
                'per_page' => $movements->perPage(),
            ],
        );

        $account->loadMissing('associate:id,full_name,document_type,status');

        return response()->json([
            'data' => $movements->getCollection()
                ->map(fn (ContributionMovement $movement): array => $this->movementPayload($movement, true))
                ->values(),
            'account' => $this->accountPayload($account, true),
            'meta' => $this->paginationPayload($movements),
        ]);
    }

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
    private function accountPayload(ContributionAccount $account, bool $includeAdminContext = false): array
    {
        $payload = [
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

        if ($includeAdminContext) {
            $payload['movements_count'] = isset($account->movements_count) ? (int) $account->movements_count : null;
            $payload['associate'] = $account->associate ? [
                'id' => $account->associate->id,
                'full_name' => $account->associate->full_name,
                'document_type' => $account->associate->document_type,
                'status' => $account->associate->status,
            ] : null;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function movementPayload(ContributionMovement $movement, bool $includeAdminContext = false): array
    {
        $payload = [
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

        if ($includeAdminContext) {
            $payload['recorded_by'] = $movement->recordedBy ? [
                'id' => $movement->recordedBy->id,
                'email' => $movement->recordedBy->email,
            ] : null;
        }

        return $payload;
    }

    /**
     * @return array{current_page: int, last_page: int, per_page: int, total: int}
     */
    private function paginationPayload(mixed $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
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
