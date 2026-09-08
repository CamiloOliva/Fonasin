<?php

namespace App\Http\Controllers;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Imports\UseCases\ImportContributionMovements;
use App\Application\Imports\UseCases\ImportCreditAccounts;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Http\Requests\Imports\ImportSpreadsheetRequest;
use App\Models\ImportBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportBatchController extends Controller
{
    public function index(Request $request, RecordAuditEvent $recordAuditEvent): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 50)));
        $type = trim((string) $request->query('type', ''));
        $query = ImportBatch::query()
            ->with('importedBy:id,email')
            ->latest();

        if ($type !== '') {
            $query->where('import_type', $type);
        }

        $batches = $query->paginate($perPage);

        ($recordAuditEvent)(
            module: AuditModule::Imports,
            action: ImportAuditAction::ImportViewed->value,
            subjectType: 'import_batch_collection',
            subjectId: $request->user()->id,
            actor: $request->user(),
            actorType: AuditActorType::User,
            ipHash: $this->ipHash($request),
            metadata: [
                'type' => $type !== '' ? $type : 'all',
                'count' => $batches->count(),
                'total' => $batches->total(),
                'per_page' => $batches->perPage(),
            ],
        );

        return response()->json([
            'data' => $batches->getCollection()
                ->map(fn (ImportBatch $batch): array => $this->batchPayload($batch))
                ->values(),
            'meta' => [
                'current_page' => $batches->currentPage(),
                'last_page' => $batches->lastPage(),
                'per_page' => $batches->perPage(),
                'total' => $batches->total(),
            ],
        ]);
    }

    public function importCredits(
        ImportSpreadsheetRequest $request,
        ImportCreditAccounts $importCreditAccounts,
    ): JsonResponse {
        try {
            $batch = $importCreditAccounts(
                file: $request->spreadsheet(),
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (CannotImportSpreadsheet $exception) {
            return $this->importError($exception);
        }

        return response()->json(['data' => $this->batchPayload($batch)], 201);
    }

    public function importContributions(
        ImportSpreadsheetRequest $request,
        ImportContributionMovements $importContributionMovements,
    ): JsonResponse {
        try {
            $batch = $importContributionMovements(
                file: $request->spreadsheet(),
                actor: $request->user(),
                ipHash: $this->ipHash($request),
            );
        } catch (CannotImportSpreadsheet $exception) {
            return $this->importError($exception);
        }

        return response()->json(['data' => $this->batchPayload($batch)], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function batchPayload(ImportBatch $batch): array
    {
        return [
            'id' => $batch->id,
            'import_type' => $batch->import_type,
            'original_filename' => $batch->original_filename,
            'mime_type' => $batch->mime_type,
            'byte_size' => $batch->byte_size,
            'status' => $batch->status,
            'rows_total' => $batch->rows_total,
            'rows_created' => $batch->rows_created,
            'rows_updated' => $batch->rows_updated,
            'rows_rejected' => $batch->rows_rejected,
            'errors' => $batch->errors,
            'started_at' => $batch->started_at?->toISOString(),
            'completed_at' => $batch->completed_at?->toISOString(),
            'created_at' => $batch->created_at?->toISOString(),
            'imported_by' => $batch->importedBy ? [
                'id' => $batch->importedBy->id,
                'email' => $batch->importedBy->email,
            ] : null,
        ];
    }

    private function ipHash(Request $request): ?string
    {
        $ip = $request->ip();

        return $ip ? app(HashesSensitiveData::class)->ip($ip) : null;
    }

    private function importError(CannotImportSpreadsheet $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage(),
        ], 422);
    }
}
