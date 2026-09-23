<?php

namespace App\Http\Controllers;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\UseCases\ReviewVoluntarySavingsRequest as ReviewRequest;
use App\Application\Contributions\UseCases\SubmitVoluntarySavingsRequest;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Http\Requests\Contributions\ReviewVoluntarySavingsRequest;
use App\Http\Requests\Contributions\StoreVoluntarySavingsRequest;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VoluntarySavingsRequestController extends Controller
{
    public function mine(Request $request, RecordAuditEvent $recordAuditEvent): JsonResponse
    {
        $associate = $request->user()->associate;
        abort_unless($associate && $associate->status === 'active', 403);
        $requests = $associate->voluntarySavingsRequests()->latest('submitted_at')->limit(12)->get();

        ($recordAuditEvent)(
            module: AuditModule::Contributions,
            action: ContributionAuditAction::VoluntarySavingsRequestViewed->value,
            subjectType: 'associate',
            subjectId: $associate->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: ['scope' => 'portal', 'count' => $requests->count()],
        );

        return response()->json(['data' => $requests->map(fn (VoluntarySavingsRequest $item): array => $this->payload($item))->values()]);
    }

    public function store(StoreVoluntarySavingsRequest $request, SubmitVoluntarySavingsRequest $submit): JsonResponse
    {
        try {
            $savingsRequest = $submit(
                actor: $request->user(),
                monthlyAmount: $request->string('monthly_amount')->toString(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($savingsRequest)], 201);
    }

    public function index(Request $request, RecordAuditEvent $recordAuditEvent): JsonResponse
    {
        $requests = VoluntarySavingsRequest::query()
            ->with(['associate:id,full_name,document_type,status', 'reviewedBy:id,email'])
            ->latest('submitted_at')
            ->paginate(min(max((int) $request->integer('per_page', 25), 1), 100));

        ($recordAuditEvent)(
            module: AuditModule::Contributions,
            action: ContributionAuditAction::VoluntarySavingsRequestViewed->value,
            subjectType: 'voluntary_savings_request_collection',
            subjectId: $request->user()->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: ['scope' => 'admin', 'count' => $requests->count(), 'total' => $requests->total()],
        );

        return response()->json([
            'data' => $requests->getCollection()->map(fn (VoluntarySavingsRequest $item): array => $this->payload($item, true))->values(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function review(ReviewVoluntarySavingsRequest $request, VoluntarySavingsRequest $voluntarySavingsRequest, ReviewRequest $review): JsonResponse
    {
        try {
            $reviewed = $review(
                request: $voluntarySavingsRequest,
                status: VoluntarySavingsRequestStatus::from($request->string('status')->toString()),
                actor: $request->user(),
                notes: $request->string('notes')->toString() ?: null,
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($reviewed->load(['associate', 'reviewedBy']), true)]);
    }

    public function authorization(Request $request, VoluntarySavingsRequest $voluntarySavingsRequest, RecordAuditEvent $recordAuditEvent): StreamedResponse
    {
        $user = $request->user();
        $isOwner = $user->associate?->id === $voluntarySavingsRequest->associate_id;
        abort_unless($isOwner || $user->hasAnyRole(['admin', 'reviewer']), 403);

        $storageKey = (string) $voluntarySavingsRequest->getAttribute('authorization_storage_key');
        abort_unless(Storage::disk('local')->exists($storageKey), 404);

        ($recordAuditEvent)(
            module: AuditModule::Contributions,
            action: ContributionAuditAction::VoluntarySavingsAuthorizationViewed->value,
            subjectType: 'voluntary_savings_request',
            subjectId: $voluntarySavingsRequest->id,
            actor: $user,
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: ['scope' => $isOwner ? 'portal' : 'admin'],
        );

        return Storage::disk('local')->response(
            $storageKey,
            'autorizacion-ahorro-voluntario.pdf',
            ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store'],
        );
    }

    private function payload(VoluntarySavingsRequest $request, bool $admin = false): array
    {
        $payload = [
            'id' => $request->id,
            'monthly_amount' => $request->monthly_amount,
            'status' => $request->status,
            'submitted_at' => $request->submitted_at?->toISOString(),
            'reviewed_at' => $request->reviewed_at?->toISOString(),
            'review_notes' => $request->review_notes,
            'links' => ['authorization' => "/portal/voluntary-savings-requests/{$request->id}/authorization"],
        ];

        if ($admin) {
            $payload['associate'] = $request->associate ? [
                'id' => $request->associate->id,
                'full_name' => $request->associate->full_name,
                'document_type' => $request->associate->document_type,
                'status' => $request->associate->status,
            ] : null;
            $payload['reviewed_by'] = $request->reviewedBy ? [
                'id' => $request->reviewedBy->id,
                'email' => $request->reviewedBy->email,
            ] : null;
        }

        return $payload;
    }

    private function ipHash(Request $request): ?string
    {
        return $request->ip() ? app(HashesSensitiveData::class)->ip((string) $request->ip()) : null;
    }
}
