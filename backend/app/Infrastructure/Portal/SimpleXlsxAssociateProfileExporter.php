<?php

namespace App\Infrastructure\Portal;

use App\Application\Portal\Contracts\ExportsAssociateProfiles;
use Shuchkin\SimpleXLSXGen;

class SimpleXlsxAssociateProfileExporter implements ExportsAssociateProfiles
{
    public function spreadsheet(array $profile): string
    {
        $rows = [
            ['FONASIN - Ficha consolidada del asociado', '', ''],
            ['Categoria', 'Campo', 'Valor'],
        ];

        $this->append($rows, 'Identificacion', $profile['associate'] ?? []);

        $application = $profile['form']['application'] ?? null;
        if (is_array($application)) {
            foreach ($application['sections'] ?? [] as $section) {
                if (is_array($section)) {
                    $this->append($rows, 'Formulario / '.($section['section'] ?? 'seccion'), $section['data'] ?? []);
                }
            }
        }

        foreach ($profile['credits']['items'] ?? [] as $index => $credit) {
            $this->append($rows, 'Cartera '.((int) $index + 1), is_array($credit) ? $credit : []);
        }

        if (is_array($profile['contributions']['account'] ?? null)) {
            $this->append($rows, 'Aportes y ahorros', $profile['contributions']['account']);
        }

        foreach ($profile['contributions']['movements'] ?? [] as $index => $movement) {
            $this->append($rows, 'Movimiento '.((int) $index + 1), is_array($movement) ? $movement : []);
        }

        return (string) SimpleXLSXGen::fromArray($rows);
    }

    /**
     * @param  list<array<int, string|int|float>>  $rows
     * @param  array<string, mixed>  $values
     */
    private function append(array &$rows, string $category, array $values, string $prefix = ''): void
    {
        foreach ($values as $key => $value) {
            $field = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($value)) {
                $this->append($rows, $category, $value, $field);

                continue;
            }

            $rows[] = [$category, $field, $this->safeCell($value)];
        }
    }

    private function safeCell(mixed $value): string|int|float
    {
        if (is_bool($value)) {
            return $value ? 'Si' : 'No';
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        $text = $value === null ? '' : (string) $value;

        return preg_match('/^[=+\-@]/', ltrim($text)) === 1 ? "'".$text : $text;
    }
}
