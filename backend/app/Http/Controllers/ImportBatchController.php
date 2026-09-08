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
use Shuchkin\SimpleXLSXGen;
use Symfony\Component\HttpFoundation\Response;

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

    public function creditTemplate(): Response
    {
        return $this->templateResponse('plantilla-creditos.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '1000000.00', '800000.00', '24', '1.2500', '50000.00', 'active'],
        ]);
    }

    public function contributionTemplate(): Response
    {
        return $this->templateResponse('plantilla-aportes.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '100000.00', '400000.00', 'registered', 'AP-001'],
            ['123456789', '2026-09-01', '2026-09-30', 'voluntary_savings', '50000.00', '150000.00', 'registered', 'AV-001'],
        ]);
    }

    public function errorReport(ImportBatch $batch): Response
    {
        $errors = collect($batch->errors ?? []);
        $handle = fopen('php://temp', 'w+');

        fputcsv($handle, ['fila', 'error']);

        foreach ($errors as $error) {
            fputcsv($handle, [
                $error['row'] ?? 'archivo',
                $error['message'] ?? 'Error no especificado.',
            ]);
        }

        rewind($handle);
        $contents = stream_get_contents($handle);
        fclose($handle);

        $filename = 'errores-importacion-'.$batch->id.'.csv';

        return response(is_string($contents) ? $contents : '', 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, max-age=0',
        ]);
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

    /**
     * @param  array<int, array<int, string>>  $rows
     */
    private function templateResponse(string $filename, array $rows): Response
    {
        $contents = (string) SimpleXLSXGen::fromArray($rows);

        return response($contents, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, max-age=0',
        ]);
    }
}
