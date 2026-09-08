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
use App\Domain\Contributions\Enums\ContributionAccountStatus;
use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Contributions\Enums\ContributionMovementType;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportContributionMovements
{
    private const IMPORT_TYPE = 'contributions';

    private const REQUIRED_COLUMNS = [
        'documento',
        'periodo',
        'fecha_corte',
        'tipo_aporte',
        'valor',
        'saldo_despues',
        'estado',
        'referencia',
    ];

    private const IMPORTABLE_TYPES = [
        ContributionMovementType::PermanentSavings->value,
        ContributionMovementType::VoluntarySavings->value,
    ];

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

                $duplicateKey = implode('|', [
                    $validated['document_hash'],
                    $validated['movement_type'],
                    $validated['period'],
                    $validated['reference'],
                ]);

                if (isset($seen[$duplicateKey])) {
                    $errors[] = $this->rowError($rowNumber, 'La combinacion documento + tipo + periodo + referencia esta duplicada en el archivo.');

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

                $account = ContributionAccount::query()->firstOrCreate(
                    ['associate_id' => $associate->id],
                    [
                        'permanent_savings_balance' => 0,
                        'voluntary_savings_balance' => 0,
                        'total_balance' => 0,
                        'status' => ContributionAccountStatus::Active->value,
                    ],
                );

                $sourceRowHash = hash('sha256', implode('|', [
                    $associate->id,
                    $validated['movement_type'],
                    $validated['period'],
                    $validated['cut_off_date'],
                    $validated['amount'],
                    $validated['balance_after'],
                    $validated['reference'],
                ]));

                $existing = ContributionMovement::query()
                    ->where('associate_id', $associate->id)
                    ->where('movement_type', $validated['movement_type'])
                    ->whereDate('period', $validated['period'])
                    ->where('reference', $validated['reference'])
                    ->where('status', ContributionMovementStatus::Registered->value)
                    ->first();

                if ($existing && $existing->source_row_hash !== $sourceRowHash) {
                    $existing->forceFill(['status' => ContributionMovementStatus::Reversed->value])->save();
                }

                $movement = ContributionMovement::query()->firstOrNew([
                    'associate_id' => $associate->id,
                    'movement_type' => $validated['movement_type'],
                    'period' => $validated['period'],
                    'source_row_hash' => $sourceRowHash,
                ]);

                $movement->forceFill([
                    'contribution_account_id' => $account->id,
                    'associate_id' => $associate->id,
                    'import_batch_id' => $batch->id,
                    'recorded_by_user_id' => $actor->id,
                    'movement_type' => $validated['movement_type'],
                    'period' => $validated['period'],
                    'cut_off_date' => $validated['cut_off_date'],
                    'amount' => $validated['amount'],
                    'balance_after' => $validated['balance_after'],
                    'status' => $validated['status'],
                    'source' => 'xlsx',
                    'reference' => $validated['reference'],
                    'source_row_hash' => $sourceRowHash,
                    'recorded_at' => now(),
                ])->save();

                $movement->wasRecentlyCreated ? $created++ : $updated++;
                $this->updateAccountBalance($account, $validated);
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
        $type = strtolower($row['tipo_aporte'] ?? '');
        $status = strtolower($row['estado'] ?? ContributionMovementStatus::Registered->value);
        $amount = $this->parseMoney($row['valor'] ?? '');
        $balanceAfter = $this->parseMoney($row['saldo_despues'] ?? '');
        $period = $this->parseDate($row['periodo'] ?? '');
        $cutOffDate = $this->parseDate($row['fecha_corte'] ?? '');

        if (($row['documento'] ?? '') === '') {
            return ['error' => $this->rowError($rowNumber, 'El documento es obligatorio.')];
        }

        if (! in_array($type, self::IMPORTABLE_TYPES, true)) {
            return ['error' => $this->rowError($rowNumber, 'El tipo de aporte no es valido para importacion.')];
        }

        if ($status !== ContributionMovementStatus::Registered->value) {
            return ['error' => $this->rowError($rowNumber, 'El estado permitido para importacion es registered.')];
        }

        if ($amount === null || $balanceAfter === null || $amount < 0 || $balanceAfter < 0) {
            return ['error' => $this->rowError($rowNumber, 'Los valores numericos deben ser validos y no negativos.')];
        }

        if (! $period || ! $cutOffDate) {
            return ['error' => $this->rowError($rowNumber, 'Periodo y fecha de corte deben tener formato YYYY-MM-DD.')];
        }

        return [
            'document_hash' => $this->hasher->documentNumber($row['documento']),
            'movement_type' => $type,
            'period' => $period->toDateString(),
            'cut_off_date' => $cutOffDate->toDateString(),
            'amount' => number_format($amount, 2, '.', ''),
            'balance_after' => number_format($balanceAfter, 2, '.', ''),
            'status' => $status,
            'reference' => trim($row['referencia'] ?? ''),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function updateAccountBalance(ContributionAccount $account, array $validated): void
    {
        $field = $validated['movement_type'] === ContributionMovementType::PermanentSavings->value
            ? 'permanent_savings_balance'
            : 'voluntary_savings_balance';

        $account->forceFill([
            $field => $validated['balance_after'],
            'last_period' => $validated['period'],
            'last_cut_off_date' => $validated['cut_off_date'],
            'last_movement_at' => now(),
        ]);

        $account->total_balance = (float) $account->permanent_savings_balance + (float) $account->voluntary_savings_balance;
        $account->save();
    }

    private function parseMoney(string $value): ?float
    {
        $normalized = str_replace(['$', ' ', ','], ['', '', '.'], trim($value));

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function parseDate(string $value): ?Carbon
    {
        $date = substr(trim($value), 0, 10);

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return null;
        }

        try {
            $parsed = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
        } catch (\Throwable) {
            return null;
        }

        return $parsed->toDateString() === $date ? $parsed : null;
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
