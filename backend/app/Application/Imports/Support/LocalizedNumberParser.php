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

        $negative = str_starts_with($normalized, '-');
        $unsigned = ltrim($normalized, '-');
        if (preg_match('/^\d{1,3}(?:\.\d{3})+,\d+$/', $unsigned)) {
            $unsigned = str_replace(',', '.', str_replace('.', '', $unsigned));
        } elseif (preg_match('/^\d{1,3}(?:,\d{3})+\.\d+$/', $unsigned)) {
            $unsigned = str_replace(',', '', $unsigned);
        } elseif ($scale === 2 && preg_match('/^[1-9]\d{0,2}(?:([.,])\d{3})(?:\1\d{3})*$/', $unsigned)) {
            $unsigned = str_replace(['.', ','], '', $unsigned);
        } elseif (preg_match('/^\d+(?:[.,]\d+)?$/', $unsigned)) {
            $unsigned = str_replace(',', '.', $unsigned);
        } else {
            return null;
        }

        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $digits = ltrim($whole.str_pad(substr($fraction, 0, $scale), $scale, '0'), '0') ?: '0';
        if (isset($fraction[$scale]) && $fraction[$scale] >= '5') {
            for ($index = strlen($digits) - 1; $index >= 0; $index--) {
                if ($digits[$index] !== '9') {
                    $digits[$index] = (string) ((int) $digits[$index] + 1);
                    break;
                }
                $digits[$index] = '0';
            }
            if ($index < 0) {
                $digits = '1'.$digits;
            }
        }
        $digits = str_pad($digits, $scale + 1, '0', STR_PAD_LEFT);
        $result = $scale > 0 ? substr($digits, 0, -$scale).'.'.substr($digits, -$scale) : $digits;

        return $negative && trim(str_replace('.', '', $result), '0') !== '' ? '-'.$result : $result;
    }
}
