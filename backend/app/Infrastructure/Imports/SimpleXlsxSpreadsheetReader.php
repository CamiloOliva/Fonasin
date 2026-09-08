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
        $xlsx = SimpleXLSX::parse($path);

        if (! $xlsx) {
            throw CannotImportSpreadsheet::invalidFile('No fue posible leer el archivo XLSX.');
        }

        $rows = $xlsx->rows();

        if (count($rows) < 2) {
            throw CannotImportSpreadsheet::invalidFile('El archivo debe incluir encabezados y al menos una fila de datos.');
        }

        $headers = array_map(fn (mixed $header): string => $this->normalizeHeader((string) $header), $rows[0]);

        if (count($headers) !== count(array_unique($headers))) {
            throw CannotImportSpreadsheet::invalidFile('El archivo contiene encabezados duplicados.');
        }

        $records = [];

        foreach (array_slice($rows, 1) as $index => $row) {
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
