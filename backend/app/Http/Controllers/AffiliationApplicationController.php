<?php

namespace App\Http\Controllers;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\ApproveAffiliationApplication;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\RejectAffiliationApplication;
use App\Application\Affiliation\UseCases\RequestAffiliationCorrection;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Affiliation\UseCases\StartAffiliationReview;
use App\Application\Affiliation\UseCases\SubmitAffiliationApplication;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Http\Requests\Affiliation\AcceptApplicationConsentRequest;
use App\Http\Requests\Affiliation\RegisterApplicationDocumentRequest;
use App\Http\Requests\Affiliation\RejectApplicationRequest;
use App\Http\Requests\Affiliation\RequestApplicationCorrectionRequest;
use App\Http\Requests\Affiliation\StoreApplicationSectionRequest;
use App\Http\Requests\Affiliation\SubmitAffiliationApplicationRequest;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\ConsentRecord;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliationApplicationController extends Controller
{
    public function store(CreateAffiliationDraft $createDraft): JsonResponse
    {
        $application = $createDraft();

        return response()->json([
            'data' => $this->applicationPayload($application),
        ], 201);
    }

    public function storeSection(
        StoreApplicationSectionRequest $request,
        AffiliationApplication $application,
        string $section,
        SaveApplicationSection $saveSection,
    ): JsonResponse {
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
        try {
            $document = $registerDocument(
                application: $application,
                documentType: ApplicationDocumentType::from($request->string('document_type')->toString()),
                originalFilename: $request->string('original_filename')->toString(),
                mimeType: $request->string('mime_type')->toString(),
                byteSize: (int) $request->integer('byte_size'),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $this->documentPayload($document),
        ], 201);
    }

    public function storeConsent(
        AcceptApplicationConsentRequest $request,
        AffiliationApplication $application,
        AcceptApplicationConsent $acceptConsent,
    ): JsonResponse {
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

    public function submit(
        SubmitAffiliationApplicationRequest $request,
        AffiliationApplication $application,
        SubmitAffiliationApplication $submitApplication,
    ): JsonResponse {
        try {
            $submitted = $submitApplication(
                application: $application,
                policyVersion: $request->string('policy_version')->toString(),
                ipHash: $this->ipHash($request),
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
            'data' => $this->applicationPayload($review),
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
            'data' => $this->applicationPayload($correction),
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
            'data' => $this->applicationPayload($approved),
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
            'data' => $this->applicationPayload($rejected),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function applicationPayload(AffiliationApplication $application): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'current_step' => $application->current_step,
            'submitted_at' => $application->submitted_at?->toJSON(),
            'reviewed_by_user_id' => $application->reviewed_by_user_id,
            'reviewed_at' => $application->reviewed_at?->toJSON(),
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
    private function documentPayload(ApplicationDocument $document): array
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
        ];
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
}
