<?php

namespace App\Application\Imports\Support;

final class LocalizedNumberParser
{
    public function parse(string $value, int $scale): ?string
    {
        $normalized = preg_replace('/(?:COP|\$|\s|\x{00A0})/iu', '', trim($value));

        if (! is_string($normalized) || $normalized === '' || ! preg_match('/^-?[0-9.,]+$/', $normalized)) {
            return null;
        }

        $lastComma = strrpos($normalized, ',');
        $lastDot = strrpos($normalized, '.');

        if ($lastComma !== false && $lastDot !== false) {
            $decimalSeparator = $lastComma > $lastDot ? ',' : '.';
            $thousandsSeparator = $decimalSeparator === ',' ? '.' : ',';
            $normalized = str_replace($thousandsSeparator, '', $normalized);
            $normalized = str_replace($decimalSeparator, '.', $normalized);
        } elseif ($lastComma !== false) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        } elseif (substr_count($normalized, '.') > 1) {
            $parts = explode('.', $normalized);
            $decimal = array_pop($parts);
            $normalized = implode('', $parts).'.'.$decimal;
        }

        if (! is_numeric($normalized)) {
            return null;
        }

        return number_format((float) $normalized, $scale, '.', '');
    }
}
