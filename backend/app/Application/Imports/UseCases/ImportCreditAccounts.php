<?php

namespace App\Application\Imports\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Imports\Support\LocalizedNumberParser;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportCreditAccounts
{
    private const IMPORT_TYPE = 'credits';

    private const REQUIRED_COLUMNS = [
        'documento',
        'nombre_completo',
        'linea_credito',
        'numero_pagare',
        'valor_inicial',
        'valor_cuota',
        'saldo_actual',
        'fecha_ultimo_pago',
    ];

    private const CREDIT_LINES = ['FONALIBRE', 'FONAPEN', 'FONAPRIMA', 'FONAROTATIVO', 'FONAPORTES'];

    public function __construct(
        private readonly ReadsSpreadsheetRows $reader,
        private readonly StoresPrivateFiles $storage,
        private readonly HashesSensitiveData $hasher,
        private readonly EncryptsSensitiveData $cipher,
        private readonly RecordAuditEvent $recordAuditEvent,
        private readonly LocalizedNumberParser $numberParser,
    ) {}

    public function __invoke(UploadedSpreadsheet $file, User $actor, ?string $ipHash = null): ImportBatch
    {
        $startedAt = hrtime(true);
        $fileHash = hash('sha256', $file->contents);
        $correlationId = (string) Str::uuid();

        if (ImportBatch::query()->where('import_type', self::IMPORT_TYPE)->where('file_hash', $fileHash)->exists()) {
            $this->auditRejected($actor, $ipHash, 'duplicate_file');

            throw CannotImportSpreadsheet::duplicateFile();
        }

        $batch = $this->createBatch($file, $actor, $fileHash);

        try {
            $rows = $this->reader->read($file->path);
            $this->ensureColumns($rows);

            return DB::transaction(function () use ($rows, $batch, $actor, $ipHash, $correlationId, $startedAt): ImportBatch {
                $created = 0;
                $updated = 0;
                $errors = [];
                $seen = [];

                foreach ($rows as $row) {
                    $this->ensureProcessingTime($startedAt);
                    $rowNumber = (int) $row['__row'];
                    $validated = $this->validateRow($row, $rowNumber);

                    if (isset($validated['error'])) {
                        $errors[] = $validated['error'];

                        continue;
                    }

                    $duplicateKey = $validated['promissory_note_hash'];

                    if (isset($seen[$duplicateKey])) {
                        $errors[] = $this->rowError($rowNumber, 'El numero de pagare esta duplicado en el archivo.');

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

                    $credit = CreditAccount::query()
                        ->where('promissory_note_number_hash', $validated['promissory_note_hash'])
                        ->first();

                    if ($credit && $credit->associate_id !== $associate->id) {
                        $errors[] = $this->rowError($rowNumber, 'El numero de pagare pertenece a otro asociado.');

                        continue;
                    }

                    if ($credit?->status === CreditAccountStatus::Archived->value) {
                        $errors[] = $this->rowError($rowNumber, 'El credito asociado al pagare esta archivado.');

                        continue;
                    }

                    $legacyCredits = CreditAccount::query()
                        ->where('associate_id', $associate->id)
                        ->where('credit_line', $validated['credit_line'])
                        ->whereNull('promissory_note_number_hash')
                        ->where('status', '!=', CreditAccountStatus::Archived->value)
                        ->limit(2)
                        ->get();

                    if (! $credit && $legacyCredits->count() > 1) {
                        $errors[] = $this->rowError($rowNumber, 'Existen varios creditos anteriores sin numero de pagare para este asociado y linea.');

                        continue;
                    }

                    $credit ??= $legacyCredits->first();

                    $payload = [
                        'associate_id' => $associate->id,
                        'credit_line' => $validated['credit_line'],
                        'promissory_note_number_hash' => $validated['promissory_note_hash'],
                        'promissory_note_number_encrypted' => $this->cipher->encryptArray([
                            'promissory_note_number' => $validated['promissory_note_number'],
                        ]),
                        'initial_balance' => $validated['initial_balance'],
                        'current_balance' => $validated['current_balance'],
                        'term_months' => $credit?->term_months,
                        'interest_rate' => $credit?->interest_rate,
                        'installment_amount' => $validated['installment_amount'],
                        'last_payment_date' => $validated['last_payment_date'],
                        'status' => $credit?->status ?? CreditAccountStatus::Active->value,
                        'registered_by_user_id' => $actor->id,
                    ];

                    if ($credit) {
                        $changedFields = $this->changedFields($credit, $payload);
                        $previousStatus = (string) $credit->status;
                        $credit->forceFill($payload)->save();

                        if ($changedFields !== []) {
                            $this->auditCreditMutation(
                                credit: $credit,
                                batch: $batch,
                                actor: $actor,
                                action: CreditAuditAction::CreditUpdated,
                                correlationId: $correlationId,
                                ipHash: $ipHash,
                                changedFields: $changedFields,
                                previousStatus: $previousStatus,
                            );
                        }

                        $updated++;
                    } else {
                        $credit = CreditAccount::query()->create($payload);
                        $this->auditCreditMutation(
                            credit: $credit,
                            batch: $batch,
                            actor: $actor,
                            action: CreditAuditAction::CreditRegistered,
                            correlationId: $correlationId,
                            ipHash: $ipHash,
                        );
                        $created++;
                    }
                }

                $this->completeBatch($batch, count($rows), $created, $updated, $errors);
                $this->auditCompleted($batch, $actor, $ipHash, $correlationId);

                return $batch->refresh();
            });
        } catch (CannotImportSpreadsheet $exception) {
            return DB::transaction(function () use ($batch, $exception, $actor, $ipHash, $correlationId): ImportBatch {
                $this->failBatch($batch, $exception->getMessage());
                $this->auditCompleted($batch->refresh(), $actor, $ipHash, $correlationId);

                return $batch->refresh();
            });
        }
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
        $fullName = trim($row['nombre_completo'] ?? '');
        $promissoryNoteNumber = strtoupper(trim($row['numero_pagare'] ?? ''));

        if (($row['documento'] ?? '') === '') {
            return ['error' => $this->rowError($rowNumber, 'El documento es obligatorio.')];
        }

        if ($fullName === '' || mb_strlen($fullName) > 255) {
            return ['error' => $this->rowError($rowNumber, 'El nombre completo es obligatorio y no puede superar 255 caracteres.')];
        }

        if ($promissoryNoteNumber === '' || mb_strlen($promissoryNoteNumber) > 120) {
            return ['error' => $this->rowError($rowNumber, 'El numero de pagare es obligatorio y no puede superar 120 caracteres.')];
        }

        if (! in_array($line, self::CREDIT_LINES, true)) {
            return ['error' => $this->rowError($rowNumber, 'La linea de credito no es valida.')];
        }

        $numbers = [
            'initial_balance' => $this->numberParser->parse($row['valor_inicial'] ?? '', 2),
            'current_balance' => $this->numberParser->parse($row['saldo_actual'] ?? '', 2),
            'installment_amount' => $this->numberParser->parse($row['valor_cuota'] ?? '', 2),
        ];

        foreach ($numbers as $field => $value) {
            if ($value === null || (float) $value < 0) {
                return ['error' => $this->rowError($rowNumber, 'Los valores numericos deben ser validos y no negativos.')];
            }
        }

        $lastPaymentDate = $this->parseDate($row['fecha_ultimo_pago'] ?? '');

        if (! $lastPaymentDate) {
            return ['error' => $this->rowError($rowNumber, 'La fecha del ultimo pago debe tener formato YYYY-MM-DD.')];
        }

        return [
            'document_hash' => $this->hasher->documentNumber($row['documento']),
            'full_name' => $fullName,
            'promissory_note_number' => $promissoryNoteNumber,
            'promissory_note_hash' => $this->hasher->financialReference($promissoryNoteNumber),
            'credit_line' => $line,
            'initial_balance' => $numbers['initial_balance'],
            'current_balance' => $numbers['current_balance'],
            'installment_amount' => $numbers['installment_amount'],
            'last_payment_date' => $lastPaymentDate->toDateString(),
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

    private function auditCompleted(
        ImportBatch $batch,
        User $actor,
        ?string $ipHash,
        ?string $correlationId = null,
    ): void {
        ($this->recordAuditEvent)(
            module: AuditModule::Imports,
            action: ImportAuditAction::ImportCompleted->value,
            subjectType: 'import_batch',
            subjectId: $batch->id,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId,
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

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, string>
     */
    private function changedFields(CreditAccount $credit, array $payload): array
    {
        return collect($payload)
            ->except(['associate_id', 'registered_by_user_id'])
            ->filter(
                fn (mixed $value, string $field): bool => (string) $credit->getAttribute($field) !== (string) $value,
            )
            ->keys()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $changedFields
     */
    private function auditCreditMutation(
        CreditAccount $credit,
        ImportBatch $batch,
        User $actor,
        CreditAuditAction $action,
        string $correlationId,
        ?string $ipHash,
        array $changedFields = [],
        ?string $previousStatus = null,
    ): void {
        $metadata = [
            'source' => 'xlsx',
            'import_batch_id' => $batch->id,
            'changed_fields' => $changedFields,
        ];

        if ($previousStatus !== null && $previousStatus !== (string) $credit->status) {
            $metadata['status_transition'] = $previousStatus.' -> '.$credit->status;
        }

        ($this->recordAuditEvent)(
            module: AuditModule::Credits,
            action: $action->value,
            subjectType: 'credit_account',
            subjectId: $credit->id,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId,
            ipHash: $ipHash,
            metadata: $metadata,
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
