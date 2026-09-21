<?php

namespace App\Infrastructure\Imports;

use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use Illuminate\Support\Str;
use Shuchkin\SimpleXLSX;

class SimpleXlsxSpreadsheetReader implements ReadsSpreadsheetRows
{
    /**
     * @return array<int, array<string, string>>
     */
    public function read(string $path): array
    {
        $startedAt = hrtime(true);
        $initialMemory = memory_get_usage(true);
        $xlsx = new SimpleXLSX;

        if (! $xlsx->unzip($path)) {
            throw CannotImportSpreadsheet::invalidFile('No fue posible leer el archivo XLSX.');
        }

        $this->ensureArchiveSize($xlsx);
        $xlsx->parseEntries();

        if (! $xlsx->success()) {
            throw CannotImportSpreadsheet::invalidFile('No fue posible leer la estructura interna del archivo XLSX.');
        }

        $rows = $xlsx->rows();
        $this->ensureResourceLimits($rows, $startedAt, $initialMemory);

        if (count($rows) < 2) {
            throw CannotImportSpreadsheet::invalidFile('El archivo debe incluir encabezados y al menos una fila de datos.');
        }

        $headers = array_map(fn (mixed $header): string => $this->normalizeHeader((string) $header), $rows[0]);

        if (count($headers) !== count(array_unique($headers))) {
            throw CannotImportSpreadsheet::invalidFile('El archivo contiene encabezados duplicados.');
        }

        $records = [];

        foreach (array_slice($rows, 1) as $index => $row) {
            $this->ensureRuntimeLimits($startedAt, $initialMemory);
            $record = ['__row' => (string) ($index + 2)];

            foreach ($headers as $columnIndex => $header) {
                $record[$header] = trim((string) ($row[$columnIndex] ?? ''));
            }

            if (count(array_filter($record, fn (string $value, string $key): bool => $key !== '__row' && $value !== '', ARRAY_FILTER_USE_BOTH)) === 0) {
                continue;
            }

            $records[] = $record;
        }

        return $records;
    }

    private function ensureArchiveSize(SimpleXLSX $xlsx): void
    {
        $maxBytes = max(1, (int) config('imports.max_uncompressed_megabytes', 64)) * 1024 * 1024;
        $uncompressedBytes = array_sum(array_map(
            fn (array $entry): int => (int) ($entry['ucs'] ?? 0),
            $xlsx->package['entries'] ?? [],
        ));

        if ($uncompressedBytes > $maxBytes) {
            throw CannotImportSpreadsheet::invalidFile('El contenido descomprimido del XLSX supera el limite permitido.');
        }
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function ensureResourceLimits(array $rows, int $startedAt, int $initialMemory): void
    {
        $dataRows = max(0, count($rows) - 1);
        $maxRows = max(1, (int) config('imports.max_rows', 5000));

        if ($dataRows > $maxRows) {
            throw CannotImportSpreadsheet::invalidFile("El archivo supera el limite de {$maxRows} filas.");
        }

        $this->ensureRuntimeLimits($startedAt, $initialMemory);
    }

    private function ensureRuntimeLimits(int $startedAt, int $initialMemory): void
    {
        $maxSeconds = max(1, (int) config('imports.max_processing_seconds', 30));
        $elapsedSeconds = (hrtime(true) - $startedAt) / 1_000_000_000;

        if ($elapsedSeconds > $maxSeconds) {
            throw CannotImportSpreadsheet::invalidFile("La lectura del archivo supero el limite de {$maxSeconds} segundos.");
        }

        $maxMemoryBytes = max(1, (int) config('imports.max_memory_megabytes', 64)) * 1024 * 1024;

        if (memory_get_usage(true) - $initialMemory > $maxMemoryBytes) {
            throw CannotImportSpreadsheet::invalidFile('La lectura del archivo supero el limite de memoria permitido.');
        }
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();
    }
}
