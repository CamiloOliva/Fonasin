<?php

namespace App\Http\Controllers;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\ApproveAffiliationApplication;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\EnableAffiliationApplication;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\RejectAffiliationApplication;
use App\Application\Affiliation\UseCases\RequestAffiliationCorrection;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Affiliation\UseCases\StartAffiliationReview;
use App\Application\Affiliation\UseCases\SubmitAffiliationApplication;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Http\Requests\Affiliation\AcceptApplicationConsentRequest;
use App\Http\Requests\Affiliation\RegisterApplicationDocumentRequest;
use App\Http\Requests\Affiliation\RegisterSignedPayrollAuthorizationRequest;
use App\Http\Requests\Affiliation\RejectApplicationRequest;
use App\Http\Requests\Affiliation\RequestApplicationCorrectionRequest;
use App\Http\Requests\Affiliation\StoreApplicationSectionRequest;
use App\Http\Requests\Affiliation\SubmitAffiliationApplicationRequest;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\ConsentRecord;
use App\Models\User;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AffiliationApplicationController extends Controller
{
    private const DRAFT_LINK_TTL_HOURS = 24;
    private const DOCUMENT_LINK_TTL_MINUTES = 10;
    private const DOCUMENT_CONTEXT_ADMIN = 'admin';
    private const DOCUMENT_CONTEXT_PORTAL = 'portal';
    private const DOCUMENT_CONTEXT_PUBLIC = 'public';

    public function index(Request $request): JsonResponse
    {
        $applications = AffiliationApplication::query()
            ->with(['reviewer'])
            ->where('status', '!=', AffiliationApplicationStatus::Draft->value)
            ->withCount([
                'sections',
                'documents' => fn ($query) => $query->where('status', ApplicationDocumentStatus::Uploaded->value),
                'consentRecords',
            ])
            ->latest('updated_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $applications
                ->map(fn (AffiliationApplication $application): array => $this->adminApplicationListPayload($application))
                ->all(),
        ]);
    }

    public function show(
        Request $request,
        AffiliationApplication $application,
        EncryptsSensitiveData $cipher,
    ): JsonResponse {
        $application->load([
            'reviewer',
            'sections' => fn ($query) => $query->oldest('section'),
            'documents' => fn ($query) => $query
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->oldest('created_at'),
            'consentRecords' => fn ($query) => $query->oldest('accepted_at'),
        ]);

        return response()->json([
            'data' => $this->adminApplicationDetailPayload($application, $cipher),
        ]);
    }

    public function store(CreateAffiliationDraft $createDraft): JsonResponse
    {
        $application = $createDraft();
        $accessToken = $this->refreshDraftAccessToken($application);

        return response()->json([
            'data' => $this->applicationPayload($application, $accessToken),
        ], 201);
    }

    public function readDraft(
        Request $request,
        AffiliationApplication $application,
        EncryptsSensitiveData $cipher,
    ): JsonResponse {
        $this->ensureDraftAccess($request, $application);

        if ($application->status !== AffiliationApplicationStatus::Draft->value) {
            return response()->json([
                'message' => 'La solicitud ya fue enviada o cerrada.',
            ], 409);
        }

        $application->load([
            'sections' => fn ($query) => $query->oldest('section'),
            'documents' => fn ($query) => $query
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->whereIn('document_type', array_map(
                    static fn (ApplicationDocumentType $documentType): string => $documentType->value,
                    ApplicationDocumentType::requiredForSubmission(),
                ))
                ->oldest('created_at'),
            'consentRecords' => fn ($query) => $query->oldest('accepted_at'),
        ]);

        return response()->json([
            'data' => [
                ...$this->applicationPayload($application),
                'sections' => $application->sections
                    ->map(fn (ApplicationSection $section): array => $this->adminSectionPayload($section, $cipher))
                    ->values()
                    ->all(),
                'documents' => $application->documents
                    ->map(fn (ApplicationDocument $document): array => $this->documentPayload($document))
                    ->values()
                    ->all(),
                'consents' => $application->consentRecords
                    ->map(fn (ConsentRecord $consent): array => $this->consentPayload($consent))
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function storeSection(
        StoreApplicationSectionRequest $request,
        AffiliationApplication $application,
        string $section,
        SaveApplicationSection $saveSection,
    ): JsonResponse {
        $this->ensureDraftAccess($request, $application);

        try {
            $applicationSection = $saveSection(
                application: $application,
                section: AffiliationApplicationStep::from($section),
                schemaVersion: (int) $request->integer('schema_version'),
                data: $request->array('data'),
                completedAt: $request->boolean('completed', true) ? now() : null,
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->sectionPayload($applicationSection),
        ]);
    }

    public function storeDocument(
        RegisterApplicationDocumentRequest $request,
        AffiliationApplication $application,
        RegisterApplicationDocument $registerDocument,
    ): JsonResponse {
        $this->ensureDraftAccess($request, $application);

        $file = $request->file('file');

        try {
            $document = $registerDocument(
                application: $application,
                documentType: ApplicationDocumentType::from($request->string('document_type')->toString()),
                originalFilename: $file->getClientOriginalName(),
                mimeType: $file->getMimeType() ?: 'application/octet-stream',
                byteSize: $file->getSize() ?: 0,
                ipHash: $this->ipHash($request),
                fileContents: $file->get(),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->documentPayload($document),
        ], 201);
    }

    public function storeSignedPayrollAuthorization(
        RegisterSignedPayrollAuthorizationRequest $request,
        AffiliationApplication $application,
        RegisterApplicationDocument $registerDocument,
    ): JsonResponse {
        $file = $request->file('file');

        try {
            $document = $registerDocument(
                application: $application,
                documentType: ApplicationDocumentType::SignedPayrollAuthorization,
                originalFilename: $file->getClientOriginalName(),
                mimeType: $file->getMimeType() ?: 'application/octet-stream',
                byteSize: $file->getSize() ?: 0,
                actor: $request->user(),
                ipHash: $this->ipHash($request),
                fileContents: $file->get(),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->documentPayload($document, self::DOCUMENT_CONTEXT_ADMIN),
        ], 201);
    }

    public function storeConsent(
        AcceptApplicationConsentRequest $request,
        AffiliationApplication $application,
        AcceptApplicationConsent $acceptConsent,
    ): JsonResponse {
        $this->ensureDraftAccess($request, $application);

        $consent = $acceptConsent(
            application: $application,
            consentType: ConsentType::from($request->string('consent_type')->toString()),
            policyVersion: $request->string('policy_version')->toString(),
            ipHash: $this->ipHash($request),
        );

        return response()->json([
            'data' => $this->consentPayload($consent),
        ], $consent->wasRecentlyCreated ? 201 : 200);
    }

    public function downloadDocument(
        Request $request,
        AffiliationApplication $application,
        ApplicationDocument $document,
        RecordAuditEvent $recordAuditEvent,
    ): StreamedResponse {
        abort_unless($document->application_id === $application->id, 404);
        abort_unless($document->status === ApplicationDocumentStatus::Uploaded->value, 404);
        $actor = $this->authorizeDocumentAccess($request, $application, $document);

        $storageKey = $document->getAttribute('storage_key');
        abort_unless(is_string($storageKey) && Storage::disk('local')->exists($storageKey), 404);

        $recordAuditEvent(
            module: AuditModule::Affiliation,
            action: AffiliationAuditAction::DocumentDownloaded->value,
            subjectType: 'application_document',
            subjectId: $document->id,
            actor: $actor,
            actorType: $actor ? AuditActorType::User : AuditActorType::System,
            ipHash: $this->ipHash($request),
            metadata: [
                'application_id' => $application->id,
                'document_type' => $document->document_type,
                'mime_type' => $document->mime_type,
                'byte_size' => $document->byte_size,
            ],
        );

        return Storage::disk('local')->download(
            $storageKey,
            $document->original_filename,
            ['Content-Type' => $document->mime_type],
        );
    }

    public function previewDocument(
        Request $request,
        AffiliationApplication $application,
        ApplicationDocument $document,
        RecordAuditEvent $recordAuditEvent,
    ): StreamedResponse {
        abort_unless($document->application_id === $application->id, 404);
        abort_unless($document->status === ApplicationDocumentStatus::Uploaded->value, 404);
        $actor = $this->authorizeDocumentAccess($request, $application, $document);

        $storageKey = $document->getAttribute('storage_key');
        abort_unless(is_string($storageKey) && Storage::disk('local')->exists($storageKey), 404);

        $recordAuditEvent(
            module: AuditModule::Affiliation,
            action: AffiliationAuditAction::DocumentViewed->value,
            subjectType: 'application_document',
            subjectId: $document->id,
            actor: $actor,
            actorType: $actor ? AuditActorType::User : AuditActorType::System,
            ipHash: $this->ipHash($request),
            metadata: [
                'application_id' => $application->id,
                'document_type' => $document->document_type,
                'mime_type' => $document->mime_type,
                'byte_size' => $document->byte_size,
            ],
        );

        return Storage::disk('local')->response(
            $storageKey,
            $document->original_filename,
            ['Content-Type' => $document->mime_type],
            'inline',
        );
    }

    public function submit(
        SubmitAffiliationApplicationRequest $request,
        AffiliationApplication $application,
        SubmitAffiliationApplication $submitApplication,
    ): JsonResponse {
        $this->ensureDraftAccess($request, $application);

        try {
            $submitted = $submitApplication(
                application: $application,
                policyVersion: $request->string('policy_version')->toString(),
                ipHash: $this->ipHash($request),
                signatureCity: $request->string('signature_city')->toString(),
                signatureDate: $request->string('signature_date')->toString(),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->applicationPayload($submitted),
        ]);
    }

    public function startReview(
        Request $request,
        AffiliationApplication $application,
        StartAffiliationReview $startReview,
    ): JsonResponse {
        try {
            $review = $startReview(
                application: $application,
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->applicationPayload($review, documentContext: self::DOCUMENT_CONTEXT_ADMIN),
        ]);
    }

    public function requestCorrection(
        RequestApplicationCorrectionRequest $request,
        AffiliationApplication $application,
        RequestAffiliationCorrection $requestCorrection,
    ): JsonResponse {
        try {
            $correction = $requestCorrection(
                application: $application,
                actor: $request->user(),
                reason: $request->string('reason')->toString(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->applicationPayload($correction, documentContext: self::DOCUMENT_CONTEXT_ADMIN),
        ]);
    }

    public function approve(
        Request $request,
        AffiliationApplication $application,
        ApproveAffiliationApplication $approveApplication,
    ): JsonResponse {
        try {
            $approved = $approveApplication(
                application: $application,
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->applicationPayload($approved, documentContext: self::DOCUMENT_CONTEXT_ADMIN),
        ]);
    }

    public function enable(
        Request $request,
        AffiliationApplication $application,
        EnableAffiliationApplication $enableApplication,
    ): JsonResponse {
        try {
            $result = $enableApplication(
                application: $application,
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => [
                'application' => $this->applicationPayload($result['application'], documentContext: self::DOCUMENT_CONTEXT_ADMIN),
                'associate' => [
                    'id' => $result['associate']->id,
                    'full_name' => $result['associate']->full_name,
                    'document_type' => $result['associate']->document_type,
                    'status' => $result['associate']->status,
                    'user_id' => $result['associate']->user_id,
                ],
                'user' => [
                    'id' => $result['user']->id,
                    'email' => $result['user']->email,
                    'status' => $result['user']->status,
                ],
                'temporary_password' => $result['temporary_password'],
            ],
        ]);
    }

    public function reject(
        RejectApplicationRequest $request,
        AffiliationApplication $application,
        RejectAffiliationApplication $rejectApplication,
    ): JsonResponse {
        try {
            $rejected = $rejectApplication(
                application: $application,
                actor: $request->user(),
                rejectionReason: $request->string('reason')->toString(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->applicationPayload($rejected, documentContext: self::DOCUMENT_CONTEXT_ADMIN),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function applicationPayload(
        AffiliationApplication $application,
        ?string $plainAccessToken = null,
        string $documentContext = self::DOCUMENT_CONTEXT_PUBLIC,
    ): array
    {
        $payload = [
            'id' => $application->id,
            'status' => $application->status,
            'current_step' => $application->current_step,
            'submitted_at' => $application->submitted_at?->toJSON(),
            'reviewed_by_user_id' => $application->reviewed_by_user_id,
            'reviewed_at' => $application->reviewed_at?->toJSON(),
            'generated_documents' => $application->documents()
                ->whereIn('document_type', [
                    ApplicationDocumentType::AffiliationSummary->value,
                    ApplicationDocumentType::PayrollAuthorization->value,
                ])
                ->where('status', ApplicationDocumentStatus::Uploaded->value)
                ->oldest('created_at')
                ->get()
                ->map(fn (ApplicationDocument $document): array => $this->documentPayload($document, $documentContext))
                ->all(),
            'links' => $this->applicationSignedLinks($application),
        ];

        if ($plainAccessToken !== null) {
            $payload['draft_access_token'] = $plainAccessToken;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function adminApplicationListPayload(AffiliationApplication $application): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'current_step' => $application->current_step,
            'submitted_at' => $application->submitted_at?->toJSON(),
            'reviewed_at' => $application->reviewed_at?->toJSON(),
            'reviewer' => $application->reviewer ? [
                'id' => $application->reviewer->id,
                'email' => $application->reviewer->email,
            ] : null,
            'sections_count' => $application->sections_count,
            'documents_count' => $application->documents_count,
            'consents_count' => $application->consent_records_count,
            'updated_at' => $application->updated_at?->toJSON(),
            'created_at' => $application->created_at?->toJSON(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function adminApplicationDetailPayload(
        AffiliationApplication $application,
        EncryptsSensitiveData $cipher,
    ): array {
        return [
            ...$this->adminApplicationListPayload($application),
            'rejection_reason' => $application->rejection_reason,
            'sections' => $application->sections
                ->map(fn (ApplicationSection $section): array => $this->adminSectionPayload($section, $cipher))
                ->values()
                ->all(),
            'documents' => $application->documents
                ->map(fn (ApplicationDocument $document): array => $this->documentPayload($document, self::DOCUMENT_CONTEXT_ADMIN))
                ->values()
                ->all(),
            'consents' => $application->consentRecords
                ->map(fn (ConsentRecord $consent): array => $this->consentPayload($consent))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function adminSectionPayload(ApplicationSection $section, EncryptsSensitiveData $cipher): array
    {
        $payload = $this->sectionPayload($section);
        $encryptedPayload = $section->getAttribute('data_encrypted');

        $payload['data'] = is_string($encryptedPayload)
            ? $cipher->decryptArray($encryptedPayload)
            : [];

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function applicationSignedLinks(AffiliationApplication $application): array
    {
        $expiresAt = now()->addHours(self::DRAFT_LINK_TTL_HOURS);

        return [
            'read' => URL::temporarySignedRoute(
                'affiliation-applications.read',
                $expiresAt,
                ['application' => $application],
                false,
            ),
            'sections' => collect(AffiliationApplicationStep::formSections())
                ->mapWithKeys(fn (AffiliationApplicationStep $section): array => [
                    $section->value => URL::temporarySignedRoute(
                        'affiliation-applications.sections.store',
                        $expiresAt,
                        [
                            'application' => $application,
                            'section' => $section->value,
                        ],
                        false,
                    ),
                ])
                ->all(),
            'documents' => URL::temporarySignedRoute(
                'affiliation-applications.documents.store',
                $expiresAt,
                ['application' => $application],
                false,
            ),
            'consents' => URL::temporarySignedRoute(
                'affiliation-applications.consents.store',
                $expiresAt,
                ['application' => $application],
                false,
            ),
            'submit' => URL::temporarySignedRoute(
                'affiliation-applications.submit',
                $expiresAt,
                ['application' => $application],
                false,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function sectionPayload(ApplicationSection $section): array
    {
        return [
            'id' => $section->id,
            'application_id' => $section->application_id,
            'section' => $section->section,
            'schema_version' => $section->schema_version,
            'completed_at' => $section->completed_at?->toJSON(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentPayload(
        ApplicationDocument $document,
        string $accessContext = self::DOCUMENT_CONTEXT_PUBLIC,
    ): array
    {
        return [
            'id' => $document->id,
            'application_id' => $document->application_id,
            'document_type' => $document->document_type,
            'original_filename' => $document->original_filename,
            'mime_type' => $document->mime_type,
            'byte_size' => $document->byte_size,
            'status' => $document->status,
            'uploaded_at' => $document->uploaded_at?->toJSON(),
            'links' => [
                'download' => URL::temporarySignedRoute(
                    'affiliation-applications.documents.download',
                    now()->addMinutes(self::DOCUMENT_LINK_TTL_MINUTES),
                    $this->documentRouteParameters($document, $accessContext),
                    false,
                ),
                'preview' => URL::temporarySignedRoute(
                    'affiliation-applications.documents.preview',
                    now()->addMinutes(self::DOCUMENT_LINK_TTL_MINUTES),
                    $this->documentRouteParameters($document, $accessContext),
                    false,
                ),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentRouteParameters(ApplicationDocument $document, string $accessContext): array
    {
        $parameters = [
            'application' => $document->application_id,
            'document' => $document,
        ];

        if ($accessContext !== self::DOCUMENT_CONTEXT_PUBLIC) {
            $parameters['context'] = $accessContext;
        }

        return $parameters;
    }

    private function authorizeDocumentAccess(
        Request $request,
        AffiliationApplication $application,
        ApplicationDocument $document,
    ): ?User {
        $context = (string) $request->query('context', self::DOCUMENT_CONTEXT_PUBLIC);
        $user = $request->user();

        if ($context === self::DOCUMENT_CONTEXT_ADMIN) {
            abort_unless($user instanceof User && ! $user->must_change_password && $user->can('view', $application), 403);

            return $user;
        }

        if ($context === self::DOCUMENT_CONTEXT_PORTAL) {
            $associate = $user instanceof User ? $user->associate : null;

            abort_unless(
                $user instanceof User
                && ! $user->must_change_password
                && $associate
                && $associate->status === 'active'
                && $application->associate_id === $associate->id
                && $document->document_type === ApplicationDocumentType::AffiliationSummary->value,
                403,
            );

            return $user;
        }

        abort_unless($context === self::DOCUMENT_CONTEXT_PUBLIC, 403);
        abort_if($document->document_type === ApplicationDocumentType::SignedPayrollAuthorization->value, 404);

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function consentPayload(ConsentRecord $consent): array
    {
        return [
            'id' => $consent->id,
            'application_id' => $consent->application_id,
            'consent_type' => $consent->consent_type,
            'policy_version' => $consent->policy_version,
            'accepted_at' => $consent->accepted_at?->toJSON(),
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

    private function refreshDraftAccessToken(AffiliationApplication $application): string
    {
        $token = bin2hex(random_bytes(32));

        $application->forceFill([
            'access_token_hash' => hash('sha256', $token),
        ])->save();

        return $token;
    }

    private function ensureDraftAccess(Request $request, AffiliationApplication $application): void
    {
        if ($application->status !== AffiliationApplicationStatus::Draft->value) {
            return;
        }

        $expectedHash = $application->access_token_hash;
        $token = $request->header('X-Affiliation-Draft-Token');

        abort_unless(
            is_string($expectedHash)
            && $expectedHash !== ''
            && is_string($token)
            && hash_equals($expectedHash, hash('sha256', $token)),
            403,
        );
    }
}
