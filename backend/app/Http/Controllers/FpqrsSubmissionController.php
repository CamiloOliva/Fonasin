<?php

namespace App\Http\Controllers;

use App\Application\Fpqrs\UseCases\SubmitFpqrsSubmission;
use App\Domain\Fpqrs\Enums\FpqrsSubmissionType;
use App\Http\Requests\Fpqrs\StoreFpqrsSubmissionRequest;
use App\Models\FpqrsSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FpqrsSubmissionController extends Controller
{
    public function store(
        StoreFpqrsSubmissionRequest $request,
        SubmitFpqrsSubmission $submitFpqrsSubmission,
    ): JsonResponse {
        $attachment = $request->file('attachment');

        $submission = $submitFpqrsSubmission(
            data: [
                'full_name' => $request->string('full_name')->toString(),
                'email' => $request->string('email')->toString(),
                'submission_type' => FpqrsSubmissionType::from($request->string('submission_type')->toString()),
                'message' => $request->string('message')->toString(),
                'attachment_original_filename' => $attachment?->getClientOriginalName(),
                'attachment_mime_type' => $attachment?->getMimeType(),
                'attachment_byte_size' => $attachment?->getSize(),
                'attachment_contents' => $attachment?->get(),
            ],
            ipHash: $this->ipHash($request),
        );

        return response()->json([
            'data' => $this->submissionPayload($submission),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function submissionPayload(FpqrsSubmission $submission): array
    {
        return [
            'id' => $submission->id,
            'submission_type' => $submission->submission_type,
            'delivery_status' => $submission->delivery_status,
            'submitted_at' => $submission->submitted_at?->toJSON(),
            'has_attachment' => $submission->attachment_storage_key !== null,
        ];
    }

    private function ipHash(Request $request): ?string
    {
        $ip = $request->ip();

        return $ip ? hash('sha256', $ip) : null;
    }
}
