<?php

namespace App\Application\Fpqrs\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Fpqrs\Enums\FpqrsAuditAction;
use App\Domain\Fpqrs\Enums\FpqrsDeliveryStatus;
use App\Domain\Fpqrs\Enums\FpqrsSubmissionType;
use App\Models\FpqrsSubmission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class SubmitFpqrsSubmission
{
    public function __construct(
        private readonly GeneratesPrivateStorageKeys $storageKeys,
        private readonly StoresPrivateFiles $privateFiles,
        private readonly DeliversFpqrsSubmissions $deliverSubmissions,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @param  array{
     *     full_name: string,
     *     email: string,
     *     submission_type: FpqrsSubmissionType,
     *     message: string,
     *     attachment_original_filename?: string|null,
     *     attachment_mime_type?: string|null,
     *     attachment_byte_size?: int|null,
     *     attachment_contents?: string|null
     * }  $data
     */
    public function __invoke(
        array $data,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): FpqrsSubmission {
        $correlationId ??= (string) Str::uuid();

        $submission = DB::transaction(function () use ($data, $correlationId, $ipHash) {
            $submittedAt = now();
            $submissionId = (string) Str::uuid();
            $email = Str::lower($data['email']);
            $attachmentStorageKey = null;

            if (($data['attachment_contents'] ?? null) !== null) {
                $attachmentStorageKey = $this->storageKeys->forFpqrsAttachment(
                    $submissionId,
                    $data['attachment_original_filename'] ?? 'attachment',
                );
                $this->privateFiles->put($attachmentStorageKey, $data['attachment_contents']);
            }

            $submission = FpqrsSubmission::query()->forceCreate([
                'id' => $submissionId,
                'full_name' => $data['full_name'],
                'email' => $email,
                'email_hash' => hash('sha256', $email),
                'submission_type' => $data['submission_type']->value,
                'message' => $data['message'],
                'attachment_original_filename' => $data['attachment_original_filename'] ?? null,
                'attachment_storage_key' => $attachmentStorageKey,
                'attachment_mime_type' => $data['attachment_mime_type'] ?? null,
                'attachment_byte_size' => $data['attachment_byte_size'] ?? null,
                'delivery_status' => FpqrsDeliveryStatus::Pending->value,
                'submitted_at' => $submittedAt,
                'ip_hash' => $ipHash,
            ]);

            ($this->recordAuditEvent)(
                module: AuditModule::Fpqrs,
                action: FpqrsAuditAction::SubmissionReceived->value,
                subjectType: 'fpqrs_submission',
                subjectId: $submission->id,
                actorType: AuditActorType::System,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'submission_type' => $submission->submission_type,
                    'has_attachment' => $attachmentStorageKey !== null,
                    'delivery_status' => $submission->delivery_status,
                ],
                occurredAt: $submittedAt,
            );

            return $submission->refresh();
        });

        try {
            $this->deliverSubmissions->deliver($submission);

            return $this->markDeliveryStatus(
                submission: $submission,
                status: FpqrsDeliveryStatus::Sent,
                action: FpqrsAuditAction::DeliverySent,
                correlationId: $correlationId,
                ipHash: $ipHash,
            );
        } catch (Throwable $exception) {
            return $this->markDeliveryStatus(
                submission: $submission,
                status: FpqrsDeliveryStatus::Failed,
                action: FpqrsAuditAction::DeliveryFailed,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'error_class' => $exception::class,
                ],
            );
        }
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function markDeliveryStatus(
        FpqrsSubmission $submission,
        FpqrsDeliveryStatus $status,
        FpqrsAuditAction $action,
        string $correlationId,
        ?string $ipHash,
        array $metadata = [],
    ): FpqrsSubmission {
        return DB::transaction(function () use ($submission, $status, $action, $correlationId, $ipHash, $metadata) {
            $submission->forceFill([
                'delivery_status' => $status->value,
            ])->save();

            ($this->recordAuditEvent)(
                module: AuditModule::Fpqrs,
                action: $action->value,
                subjectType: 'fpqrs_submission',
                subjectId: $submission->id,
                actorType: AuditActorType::System,
                correlationId: $correlationId,
                ipHash: $ipHash,
                metadata: [
                    'delivery_status' => $status->value,
                    ...$metadata,
                ],
                occurredAt: now(),
            );

            return $submission->refresh();
        });
    }
}
