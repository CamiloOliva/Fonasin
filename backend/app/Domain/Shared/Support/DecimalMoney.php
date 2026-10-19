<?php

namespace App\Domain\Shared\Support;

/** Unformatted decimal amounts: at most twelve integer digits and two decimal places. */
final class DecimalMoney
{
    public static function canonical(mixed $value): ?string
    {
        if (is_float($value)) {
            if (! is_finite($value) || abs($value) >= 1000000000000) {
                return null;
            }
            // F is locale-independent and does not use PHP's precision setting.
            // Formatting is not permission to round: require an exact round trip.
            $decimal = sprintf('%.2F', $value);
            if ((float) $decimal !== $value) {
                return null;
            }
            $value = $decimal;
        } elseif (is_int($value)) {
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
