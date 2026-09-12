<?php

namespace App\Application\Imports\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\UseCases\RebuildContributionAccountBalances;
use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Imports\Support\LocalizedNumberParser;
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
    private const REQUIRED_COLUMNS = [
        'documento',
        'nombre_completo',
        'valor_mensual',
        'saldo',
        'fecha_ultimo_pago',
    ];

    public function __construct(
        private readonly ReadsSpreadsheetRows $reader,
        private readonly StoresPrivateFiles $storage,
        private readonly HashesSensitiveData $hasher,
        private readonly RecordAuditEvent $recordAuditEvent,
        private readonly LocalizedNumberParser $numberParser,
        private readonly RebuildContributionAccountBalances $rebuildAccountBalances,
    ) {}

    public function __invoke(
        UploadedSpreadsheet $file,
        User $actor,
        ContributionMovementType $movementType,
        string $importType,
        ?string $ipHash = null,
    ): ImportBatch {
        $startedAt = hrtime(true);
        $fileHash = hash('sha256', $file->contents);

        if (ImportBatch::query()->where('import_type', $importType)->where('file_hash', $fileHash)->exists()) {
            $this->auditRejected($actor, $ipHash, $importType, 'duplicate_file');

            throw CannotImportSpreadsheet::duplicateFile();
        }

        $batch = $this->createBatch($file, $actor, $fileHash, $importType);

        try {
            $rows = $this->reader->read($file->path);
            $this->ensureColumns($rows);

            return DB::transaction(function () use ($rows, $batch, $actor, $movementType, $importType, $ipHash, $startedAt): ImportBatch {
                $created = 0;
                $updated = 0;
                $errors = [];
                $seen = [];
                $affectedAccounts = [];

                foreach ($rows as $row) {
                    $this->ensureProcessingTime($startedAt);
                    $rowNumber = (int) $row['__row'];
                    $validated = $this->validateRow($row, $rowNumber, $movementType);

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

                    if ($this->normalizedName($associate->full_name) !== $this->normalizedName($validated['full_name'])) {
                        $errors[] = $this->rowError($rowNumber, 'El nombre completo no coincide con el asociado del documento informado.');

                        continue;
                    }

                    $account = ContributionAccount::query()->firstOrCreate(
                        ['associate_id' => $associate->id],
                        [
                            'contribution_balance' => 0,
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
                    $affectedAccounts[$account->id] = $account;
                }

                foreach ($affectedAccounts as $account) {
                    ($this->rebuildAccountBalances)($account);
                }

                $this->completeBatch($batch, count($rows), $created, $updated, $errors);
                $this->auditCompleted($batch, $actor, $ipHash, $importType);

                return $batch->refresh();
            });
        } catch (CannotImportSpreadsheet $exception) {
            return DB::transaction(function () use ($batch, $exception, $actor, $importType, $ipHash): ImportBatch {
                $this->failBatch($batch, $exception->getMessage());
                $this->auditCompleted($batch->refresh(), $actor, $ipHash, $importType);

                return $batch->refresh();
            });
        }
    }

    private function createBatch(UploadedSpreadsheet $file, User $actor, string $fileHash, string $importType): ImportBatch
    {
        $storageKey = 'private/imports/'.$importType.'/'.Str::uuid().'.xlsx';
        $this->storage->put($storageKey, $file->contents);

        return ImportBatch::query()->create([
            'imported_by_user_id' => $actor->id,
            'import_type' => $importType,
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
    private function validateRow(array $row, int $rowNumber, ContributionMovementType $movementType): array
    {
        $fullName = trim($row['nombre_completo'] ?? '');
        $amount = $this->numberParser->parse($row['valor_mensual'] ?? '', 2);
        $balanceAfter = $this->numberParser->parse($row['saldo'] ?? '', 2);
        $lastPaymentDate = $this->parseDate($row['fecha_ultimo_pago'] ?? '');

        if (($row['documento'] ?? '') === '') {
            return ['error' => $this->rowError($rowNumber, 'El documento es obligatorio.')];
        }

        if ($fullName === '' || mb_strlen($fullName) > 255) {
            return ['error' => $this->rowError($rowNumber, 'El nombre completo es obligatorio y no puede superar 255 caracteres.')];
        }

        if ($amount === null || $balanceAfter === null || (float) $amount < 0 || (float) $balanceAfter < 0) {
            return ['error' => $this->rowError($rowNumber, 'Los valores numericos deben ser validos y no negativos.')];
        }

        if (! $lastPaymentDate) {
            return ['error' => $this->rowError($rowNumber, 'La fecha del ultimo pago debe tener formato YYYY-MM-DD.')];
        }

        $period = $lastPaymentDate->copy()->startOfMonth()->toDateString();
        $reference = strtoupper($movementType->value).'-'.$lastPaymentDate->toDateString();

        return [
            'document_hash' => $this->hasher->documentNumber($row['documento']),
            'full_name' => $fullName,
            'movement_type' => $movementType->value,
            'period' => $period,
            'cut_off_date' => $lastPaymentDate->toDateString(),
            'amount' => $amount,
            'balance_after' => $balanceAfter,
            'status' => ContributionMovementStatus::Registered->value,
            'reference' => $reference,
        ];
    }

    private function normalizedName(string $name): string
    {
        return Str::of($name)->ascii()->upper()->squish()->toString();
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

    private function auditCompleted(ImportBatch $batch, User $actor, ?string $ipHash, string $importType): void
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
                'type' => $importType,
                'status' => $batch->status,
                'rows_total' => $batch->rows_total,
                'rows_created' => $batch->rows_created,
                'rows_updated' => $batch->rows_updated,
                'rows_rejected' => $batch->rows_rejected,
            ],
        );
    }

    private function ensureProcessingTime(int $startedAt): void
    {
        $maxSeconds = max(1, (int) config('imports.max_processing_seconds', 30));
        $elapsedSeconds = (hrtime(true) - $startedAt) / 1_000_000_000;

        if ($elapsedSeconds > $maxSeconds) {
            throw CannotImportSpreadsheet::invalidFile('La importacion supero el limite de tiempo configurado.');
        }
    }

    private function auditRejected(User $actor, ?string $ipHash, string $importType, string $reason): void
    {
        ($this->recordAuditEvent)(
            module: AuditModule::Imports,
            action: ImportAuditAction::ImportRejected->value,
            subjectType: 'import_batch',
            subjectId: $actor->id,
            actor: $actor,
            actorType: AuditActorType::User,
            ipHash: $ipHash,
            metadata: ['type' => $importType, 'reason' => $reason],
        );
    }
}
