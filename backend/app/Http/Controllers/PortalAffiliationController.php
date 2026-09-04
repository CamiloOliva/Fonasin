<?php

namespace App\Http\Controllers;

use App\Application\Portal\UseCases\ViewAssociateAffiliation;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class PortalAffiliationController extends Controller
{
    public function show(Request $request, ViewAssociateAffiliation $viewAssociateAffiliation): JsonResponse
    {
        try {
            $application = $viewAssociateAffiliation(
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (DomainException $exception) {
            return $this->domainError($exception);
        }

        return response()->json([
            'data' => $application ? $this->applicationPayload($application) : null,
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
            'submitted_at' => $application->submitted_at?->toJSON(),
            'enabled_at' => $application->updated_at?->toJSON(),
            'documents' => $application->documents
                ->map(fn (ApplicationDocument $document): array => $this->documentPayload($document))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentPayload(ApplicationDocument $document): array
    {
        return [
            'id' => $document->id,
            'document_type' => $document->document_type,
            'original_filename' => $document->original_filename,
            'mime_type' => $document->mime_type,
            'byte_size' => $document->byte_size,
            'uploaded_at' => $document->uploaded_at?->toJSON(),
            'links' => [
                'preview' => URL::temporarySignedRoute(
                    'affiliation-applications.documents.preview',
                    now()->addHours(24),
                    [
                        'application' => $document->application_id,
                        'document' => $document,
                    ],
                    false,
                ),
            ],
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
