<?php

namespace App\Application\Imports\UseCases;

use App\Application\Affiliation\UseCases\CreateAssociateManually;
use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\ImportBatch;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportAssociates
{
    private const IMPORT_TYPE = 'associates';

    private const REQUIRED_COLUMNS = ['documento', 'nombre_completo', 'correo'];

    public function __construct(
        private readonly ReadsSpreadsheetRows $reader,
        private readonly StoresPrivateFiles $storage,
        private readonly CreateAssociateManually $createAssociate,
        private readonly RecordAuditEvent $recordAuditEvent,
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
            $created = 0;
            $errors = [];
            $seenDocuments = [];
            $seenEmails = [];

            foreach ($rows as $row) {
                $this->ensureProcessingTime($startedAt);
                $rowNumber = (int) $row['__row'];
                $validated = $this->validateRow($row, $rowNumber);

                if (isset($validated['error'])) {
                    $errors[] = $validated['error'];

                    continue;
                }

                $documentKey = strtoupper($validated['document_number']);
                $emailKey = strtolower($validated['email']);

                if (isset($seenDocuments[$documentKey]) || isset($seenEmails[$emailKey])) {
                    $errors[] = $this->rowError($rowNumber, 'El documento o correo esta duplicado dentro del archivo.');

                    continue;
                }

                $seenDocuments[$documentKey] = true;
                $seenEmails[$emailKey] = true;

                try {
                    DB::transaction(fn () => ($this->createAssociate)(
                        data: [
                            'document_type' => 'CC',
                            'document_number' => $validated['document_number'],
                            'full_name' => $validated['full_name'],
                            'email' => $validated['email'],
                            'status' => 'active',
                        ],
                        actor: $actor,
                        correlationId: $correlationId,
                        ipHash: $ipHash,
                    ));
                    $created++;
                } catch (DomainException $exception) {
                    $errors[] = $this->rowError($rowNumber, $exception->getMessage());
                }
            }

            $this->completeBatch($batch, count($rows), $created, $errors);
            $this->auditCompleted($batch->refresh(), $actor, $ipHash, $correlationId);

            return $batch->refresh();
        } catch (CannotImportSpreadsheet $exception) {
            $this->failBatch($batch, $exception->getMessage());
            $this->auditCompleted($batch->refresh(), $actor, $ipHash, $correlationId);

            return $batch->refresh();
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

    /** @param array<int, array<string, string>> $rows */
    private function ensureColumns(array $rows): void
    {
        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, array_keys($rows[0] ?? [])));

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
        $document = trim($row['documento'] ?? '');
        $fullName = Str::of($row['nombre_completo'] ?? '')->squish()->toString();
        $email = Str::lower(trim($row['correo'] ?? ''));

        if (! preg_match('/^[0-9]{5,16}$/', $document)) {
            return ['error' => $this->rowError($rowNumber, 'La cedula debe contener entre 5 y 16 digitos.')];
        }

        if (mb_strlen($fullName) < 3 || mb_strlen($fullName) > 255) {
            return ['error' => $this->rowError($rowNumber, 'El nombre completo es obligatorio y no puede superar 255 caracteres.')];
        }

        if (mb_strlen($email) > 255 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return ['error' => $this->rowError($rowNumber, 'El correo electronico no es valido.')];
        }

        return [
            'document_number' => $document,
            'full_name' => $fullName,
            'email' => $email,
        ];
    }

    /** @param array<int, array<string, mixed>> $errors */
    private function completeBatch(ImportBatch $batch, int $total, int $created, array $errors): void
    {
        $batch->forceFill([
            'status' => $errors === [] ? 'completed' : 'completed_with_errors',
            'rows_total' => $total,
            'rows_created' => $created,
            'rows_updated' => 0,
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

    /** @return array{row: int, message: string} */
    private function rowError(int $row, string $message): array
    {
        return ['row' => $row, 'message' => $message];
    }

    private function auditCompleted(ImportBatch $batch, User $actor, ?string $ipHash, string $correlationId): void
    {
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

    private function ensureProcessingTime(int $startedAt): void
    {
        $maxSeconds = max(1, (int) config('imports.max_processing_seconds', 30));

        if ((hrtime(true) - $startedAt) / 1_000_000_000 > $maxSeconds) {
            throw CannotImportSpreadsheet::invalidFile('La importacion supero el limite de tiempo configurado.');
        }
    }
}
