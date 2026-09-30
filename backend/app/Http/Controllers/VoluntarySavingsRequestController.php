<?php

namespace App\Http\Controllers;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\UseCases\OpenVoluntarySavingsAuthorization;
use App\Application\Contributions\UseCases\RegisterSignedVoluntarySavingsAuthorization;
use App\Application\Contributions\UseCases\ReviewVoluntarySavingsRequest as ReviewRequest;
use App\Application\Contributions\UseCases\SubmitVoluntarySavingsRequest;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use App\Http\Requests\Contributions\ReviewVoluntarySavingsRequest;
use App\Http\Requests\Contributions\StoreSignedVoluntarySavingsAuthorizationRequest;
use App\Http\Requests\Contributions\StoreVoluntarySavingsRequest;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                monthlyAmount: $request->integer('monthly_amount'),
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

    public function previewPayrollAuthorization(
        Request $request,
        VoluntarySavingsRequest $voluntarySavingsRequest,
        OpenVoluntarySavingsAuthorization $open,
    ): StreamedResponse {
        return $this->authorizationResponse(
            httpRequest: $request,
            savingsRequest: $voluntarySavingsRequest,
            open: $open,
            download: false,
            signed: false,
        );
    }

    public function downloadPayrollAuthorization(
        Request $request,
        VoluntarySavingsRequest $voluntarySavingsRequest,
        OpenVoluntarySavingsAuthorization $open,
    ): StreamedResponse {
        return $this->authorizationResponse(
            httpRequest: $request,
            savingsRequest: $voluntarySavingsRequest,
            open: $open,
            download: true,
            signed: false,
        );
    }

    public function storeSignedAuthorization(
        StoreSignedVoluntarySavingsAuthorizationRequest $request,
        VoluntarySavingsRequest $voluntarySavingsRequest,
        RegisterSignedVoluntarySavingsAuthorization $register,
    ): JsonResponse {
        try {
            $updated = $register(
                request: $voluntarySavingsRequest,
                contents: $request->file('file')->get(),
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($updated->load(['associate', 'reviewedBy']), true)], 201);
    }

    public function previewSignedAuthorization(
        Request $request,
        VoluntarySavingsRequest $voluntarySavingsRequest,
        OpenVoluntarySavingsAuthorization $open,
    ): StreamedResponse {
        return $this->authorizationResponse($request, $voluntarySavingsRequest, $open, false, true);
    }

    public function downloadSignedAuthorization(
        Request $request,
        VoluntarySavingsRequest $voluntarySavingsRequest,
        OpenVoluntarySavingsAuthorization $open,
    ): StreamedResponse {
        return $this->authorizationResponse($request, $voluntarySavingsRequest, $open, true, true);
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
        ];

        $prefix = $admin ? 'admin' : 'portal';
        $payload['links'] = [
            'payroll_authorization_preview' => "/{$prefix}/voluntary-savings-requests/{$request->id}/payroll-authorization/preview",
            'payroll_authorization_download' => "/{$prefix}/voluntary-savings-requests/{$request->id}/payroll-authorization/download",
        ];
        if ($request->getAttribute('signed_authorization_storage_key')) {
            $payload['links']['signed_authorization_preview'] = "/{$prefix}/voluntary-savings-requests/{$request->id}/signed-authorization/preview";
            $payload['links']['signed_authorization_download'] = "/{$prefix}/voluntary-savings-requests/{$request->id}/signed-authorization/download";
        }

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
            $payload['signed_authorization_uploaded_at'] = $request->signed_authorization_uploaded_at?->toISOString();
        }

        return $payload;
    }

    private function authorizationResponse(
        Request $httpRequest,
        VoluntarySavingsRequest $savingsRequest,
        OpenVoluntarySavingsAuthorization $open,
        bool $download,
        bool $signed,
    ): StreamedResponse {
        try {
            $stream = $open($savingsRequest, $httpRequest->user(), $signed, $download,
                $httpRequest->routeIs('portal.*') ? 'portal' : 'admin', $this->ipHash($httpRequest));
        } catch (DomainException) {
            abort(404);
        }
        $suffix = $signed ? '-firmada' : '';
        $filename = "libranza-ahorro-voluntario{$suffix}-{$savingsRequest->id}.pdf";

        return response()->stream(function () use ($stream): void {
            try {
                fpassthru($stream);
            } finally {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'private, no-store',
            'Content-Disposition' => ($download ? 'attachment' : 'inline').'; filename="'.$filename.'"',
        ]);
    }

    private function ipHash(Request $request): ?string
    {
        return $request->ip() ? app(HashesSensitiveData::class)->ip((string) $request->ip()) : null;
    }
}
