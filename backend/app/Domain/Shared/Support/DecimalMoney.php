<?php

namespace App\Domain\Shared\Support;

/** Unformatted decimal amounts: at most twelve integer digits and two decimal places. */
final class DecimalMoney
{
    public static function canonical(mixed $value): ?string
    {
        if (is_int($value) || (is_float($value) && is_finite($value))) {
            $value = (string) $value;
        }
        if (! is_string($value) || preg_match('/\A-?\d{1,12}(?:\.\d{1,2})?\z/', $value) !== 1) {
            return null;
        }
        $negative = str_starts_with($value, '-');
        [$integer, $fraction] = array_pad(explode('.', ltrim($value, '-'), 2), 2, '');
        $integer = ltrim($integer, '0') ?: '0';
        $fraction = rtrim($fraction, '0');
        $canonical = $integer.($fraction !== '' ? '.'.$fraction : '');

        return ($negative && $canonical !== '0' ? '-' : '').$canonical;
    }
}
