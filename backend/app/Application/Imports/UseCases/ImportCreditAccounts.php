<?php

namespace App\Application\Imports\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportCreditAccounts
{
    private const IMPORT_TYPE = 'credits';

    private const REQUIRED_COLUMNS = [
        'documento',
        'linea_credito',
        'valor_inicial',
        'saldo_actual',
        'plazo_meses',
        'tasa_interes',
        'valor_cuota',
        'estado',
    ];

    private const CREDIT_LINES = ['FONALIBRE', 'FONAPEN', 'FONAPRIMA', 'FONAROTATIVO', 'FONAPORTES'];

    public function __construct(
        private readonly ReadsSpreadsheetRows $reader,
        private readonly StoresPrivateFiles $storage,
        private readonly HashesSensitiveData $hasher,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    public function __invoke(UploadedSpreadsheet $file, User $actor, ?string $ipHash = null): ImportBatch
    {
        $fileHash = hash('sha256', $file->contents);

        if (ImportBatch::query()->where('import_type', self::IMPORT_TYPE)->where('file_hash', $fileHash)->exists()) {
            $this->auditRejected($actor, $ipHash, 'duplicate_file');

            throw CannotImportSpreadsheet::duplicateFile();
        }

        return DB::transaction(function () use ($file, $actor, $ipHash, $fileHash): ImportBatch {
            $batch = $this->createBatch($file, $actor, $fileHash);

            try {
                $rows = $this->reader->read($file->path);
                $this->ensureColumns($rows);
            } catch (CannotImportSpreadsheet $exception) {
                $this->failBatch($batch, $exception->getMessage());
                $this->auditCompleted($batch->refresh(), $actor, $ipHash);

                return $batch->refresh();
            }

            $created = 0;
            $updated = 0;
            $errors = [];
            $seen = [];

            foreach ($rows as $row) {
                $rowNumber = (int) $row['__row'];
                $validated = $this->validateRow($row, $rowNumber);

                if (isset($validated['error'])) {
                    $errors[] = $validated['error'];

                    continue;
                }

                $duplicateKey = $validated['document_hash'].'|'.$validated['credit_line'];

                if (isset($seen[$duplicateKey])) {
                    $errors[] = $this->rowError($rowNumber, 'La combinacion documento + linea de credito esta duplicada en el archivo.');

                    continue;
                }

                $seen[$duplicateKey] = true;
                $associate = Associate::query()
                    ->where('document_number_hash', $validated['document_hash'])
                    ->where('status', 'active')
                    ->first();

                if (! $associate) {
                    $errors[] = $this->rowError($rowNumber, 'No existe un asociado activo para el documento informado.');

                    continue;
                }

                $credit = CreditAccount::query()
                    ->where('associate_id', $associate->id)
                    ->where('credit_line', $validated['credit_line'])
                    ->where('status', '!=', CreditAccountStatus::Archived->value)
                    ->first();

                $payload = [
                    'associate_id' => $associate->id,
                    'credit_line' => $validated['credit_line'],
                    'initial_balance' => $validated['initial_balance'],
                    'current_balance' => $validated['current_balance'],
                    'term_months' => $validated['term_months'],
                    'interest_rate' => $validated['interest_rate'],
                    'installment_amount' => $validated['installment_amount'],
                    'status' => $validated['status'],
                    'registered_by_user_id' => $actor->id,
                ];

                if ($credit) {
                    if (! $this->statusTransitionAllowed((string) $credit->status, $validated['status'])) {
                        $errors[] = $this->rowError($rowNumber, 'La transicion de estado del credito no es valida.');

                        continue;
                    }

                    $credit->forceFill($payload)->save();
                    $updated++;
                } else {
                    CreditAccount::query()->create($payload);
                    $created++;
                }
            }

            $this->completeBatch($batch, count($rows), $created, $updated, $errors);
            $this->auditCompleted($batch, $actor, $ipHash);

            return $batch->refresh();
        });
    }

    private function createBatch(UploadedSpreadsheet $file, User $actor, string $fileHash): ImportBatch
    {
        $storageKey = 'private/imports/'.self::IMPORT_TYPE.'/'.Str::uuid().'.xlsx';
        $this->storage->put($storageKey, $file->contents);

        return ImportBatch::query()->create([
            'imported_by_user_id' => $actor->id,
            'import_type' => self::IMPORT_TYPE,
            'original_filename' => basename($file->originalName),
            'storage_key' => $storageKey,
            'file_hash' => $fileHash,
            'mime_type' => $file->mimeType,
            'byte_size' => $file->byteSize,
            'status' => 'processing',
            'started_at' => now(),
        ]);
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     */
    private function ensureColumns(array $rows): void
    {
        $columns = array_keys($rows[0] ?? []);
        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, $columns));

        if ($missing !== []) {
            throw CannotImportSpreadsheet::invalidFile('Faltan columnas obligatorias: '.implode(', ', $missing).'.');
        }
    }

    /**
     * @param  array<string, string>  $row
     * @return array<string, mixed>
     */
    private function validateRow(array $row, int $rowNumber): array
    {
        $line = strtoupper($row['linea_credito'] ?? '');
        $status = strtolower($row['estado'] ?? CreditAccountStatus::Active->value);

        if (($row['documento'] ?? '') === '') {
            return ['error' => $this->rowError($rowNumber, 'El documento es obligatorio.')];
        }

        if (! in_array($line, self::CREDIT_LINES, true)) {
            return ['error' => $this->rowError($rowNumber, 'La linea de credito no es valida.')];
        }

        if (! in_array($status, array_column(CreditAccountStatus::cases(), 'value'), true)) {
            return ['error' => $this->rowError($rowNumber, 'El estado del credito no es valido.')];
        }

        $numbers = [
            'initial_balance' => $this->parseMoney($row['valor_inicial'] ?? ''),
            'current_balance' => $this->parseMoney($row['saldo_actual'] ?? ''),
            'interest_rate' => $this->parseDecimal($row['tasa_interes'] ?? ''),
            'installment_amount' => $this->parseMoney($row['valor_cuota'] ?? ''),
        ];

        foreach ($numbers as $field => $value) {
            if ($value === null || $value < 0) {
                return ['error' => $this->rowError($rowNumber, 'Los valores numericos deben ser validos y no negativos.')];
            }
        }

        $termMonths = filter_var($row['plazo_meses'] ?? null, FILTER_VALIDATE_INT);

        if (! is_int($termMonths) || $termMonths < 1) {
            return ['error' => $this->rowError($rowNumber, 'El plazo en meses debe ser un entero mayor a cero.')];
        }

        return [
            'document_hash' => $this->hasher->documentNumber($row['documento']),
            'credit_line' => $line,
            'initial_balance' => number_format($numbers['initial_balance'], 2, '.', ''),
            'current_balance' => number_format($numbers['current_balance'], 2, '.', ''),
            'term_months' => $termMonths,
            'interest_rate' => number_format($numbers['interest_rate'], 4, '.', ''),
            'installment_amount' => number_format($numbers['installment_amount'], 2, '.', ''),
            'status' => $status,
        ];
    }

    private function parseMoney(string $value): ?float
    {
        return $this->parseDecimal(str_replace(['$', ' '], '', $value));
    }

    private function parseDecimal(string $value): ?float
    {
        $normalized = str_replace(',', '.', trim($value));

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function completeBatch(ImportBatch $batch, int $total, int $created, int $updated, array $errors): void
    {
        $batch->forceFill([
            'status' => $errors === [] ? 'completed' : 'completed_with_errors',
            'rows_total' => $total,
            'rows_created' => $created,
            'rows_updated' => $updated,
            'rows_rejected' => count($errors),
            'errors' => $errors,
            'completed_at' => now(),
        ])->save();
    }

    private function failBatch(ImportBatch $batch, string $message): void
    {
        $batch->forceFill([
            'status' => 'failed',
            'rows_total' => 0,
            'rows_created' => 0,
            'rows_updated' => 0,
            'rows_rejected' => 0,
            'errors' => [['row' => null, 'message' => $message]],
            'completed_at' => now(),
        ])->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function rowError(int $row, string $message): array
    {
        return ['row' => $row, 'message' => $message];
    }

    private function auditCompleted(ImportBatch $batch, User $actor, ?string $ipHash): void
    {
        ($this->recordAuditEvent)(
            module: AuditModule::Imports,
            action: ImportAuditAction::ImportCompleted->value,
            subjectType: 'import_batch',
            subjectId: $batch->id,
            actor: $actor,
            actorType: AuditActorType::User,
            ipHash: $ipHash,
            metadata: [
                'type' => self::IMPORT_TYPE,
                'status' => $batch->status,
                'rows_total' => $batch->rows_total,
                'rows_created' => $batch->rows_created,
                'rows_updated' => $batch->rows_updated,
                'rows_rejected' => $batch->rows_rejected,
            ],
        );
    }

    private function statusTransitionAllowed(string $from, string $to): bool
    {
        if ($from === $to) {
            return true;
        }

        $allowed = [
            CreditAccountStatus::Active->value => [
                CreditAccountStatus::Settled->value,
                CreditAccountStatus::Archived->value,
            ],
            CreditAccountStatus::Settled->value => [
                CreditAccountStatus::Archived->value,
            ],
        ];

        return in_array($to, $allowed[$from] ?? [], true);
    }

    private function auditRejected(User $actor, ?string $ipHash, string $reason): void
    {
        ($this->recordAuditEvent)(
            module: AuditModule::Imports,
            action: ImportAuditAction::ImportRejected->value,
            subjectType: 'import_batch',
            subjectId: $actor->id,
            actor: $actor,
            actorType: AuditActorType::User,
            ipHash: $ipHash,
            metadata: ['type' => self::IMPORT_TYPE, 'reason' => $reason],
        );
    }
}
