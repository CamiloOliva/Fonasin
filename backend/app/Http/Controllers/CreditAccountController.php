<?php

namespace App\Http\Controllers;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Credits\UseCases\ArchiveCreditAccount;
use App\Application\Credits\UseCases\RegisterCreditAccount;
use App\Application\Credits\UseCases\UpdateCreditAccount;
use App\Application\Credits\UseCases\ViewAssociateCredits;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Http\Requests\Credits\StoreCreditAccountRequest;
use App\Http\Requests\Credits\UpdateCreditAccountRequest;
use App\Models\Associate;
use App\Models\CreditAccount;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditAccountController extends Controller
{
    public function index(Request $request, RecordAuditEvent $recordAuditEvent): JsonResponse
    {
        $credits = CreditAccount::query()
            ->with('associate:id,full_name,document_type,status')
            ->latest()
            ->get();

        ($recordAuditEvent)(
            module: AuditModule::Credits,
            action: CreditAuditAction::CreditViewed->value,
            subjectType: 'credit_account_collection',
            subjectId: $request->user()->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: [
                'scope' => 'admin',
                'count' => $credits->count(),
            ],
        );

        return response()->json([
            'data' => $credits->map(fn (CreditAccount $credit): array => $this->creditPayload($credit))->values(),
        ]);
    }

    public function store(
        StoreCreditAccountRequest $request,
        RegisterCreditAccount $registerCreditAccount,
    ): JsonResponse {
        $associate = Associate::query()->findOrFail($request->string('associate_id')->toString());

        try {
            $credit = $registerCreditAccount(
                associate: $associate,
                actor: $request->user(),
                data: $request->validated(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->creditPayload($credit),
        ], 201);
    }

    public function update(
        UpdateCreditAccountRequest $request,
        CreditAccount $credit,
        UpdateCreditAccount $updateCreditAccount,
    ): JsonResponse {
        try {
            $updated = $updateCreditAccount(
                credit: $credit,
                actor: $request->user(),
                data: $request->validated(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->creditPayload($updated),
        ]);
    }

    public function archive(
        Request $request,
        CreditAccount $credit,
        ArchiveCreditAccount $archiveCreditAccount,
    ): JsonResponse {
        $archived = $archiveCreditAccount(
            credit: $credit,
            actor: $request->user(),
            ipHash: $this->ipHash($request),
        );

        return response()->json([
            'data' => $this->creditPayload($archived),
        ]);
    }

    public function mine(Request $request, ViewAssociateCredits $viewAssociateCredits): JsonResponse
    {
        try {
            $credits = $viewAssociateCredits(
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $credits->map(fn (CreditAccount $credit): array => $this->creditPayload($credit))->values(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function creditPayload(CreditAccount $credit): array
    {
        return [
            'id' => $credit->id,
            'associate_id' => $credit->associate_id,
            'credit_line' => $credit->credit_line,
            'initial_balance' => $credit->initial_balance,
            'current_balance' => $credit->current_balance,
            'term_months' => $credit->term_months,
            'interest_rate' => $credit->interest_rate,
            'installment_amount' => $credit->installment_amount,
            'status' => $credit->status,
            'registered_by_user_id' => $credit->registered_by_user_id,
            'associate' => $credit->associate ? [
                'id' => $credit->associate->id,
                'full_name' => $credit->associate->full_name,
                'document_type' => $credit->associate->document_type,
                'status' => $credit->associate->status,
            ] : null,
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

        return $ip ? hash('sha256', $ip) : null;
    }
}
