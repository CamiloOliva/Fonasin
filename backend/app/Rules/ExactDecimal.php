<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** HTTP boundary: JSON floats may have lost precision before validation. */
final class ExactDecimal implements ValidationRule
{
    public function __construct(private readonly int $integerDigits, private readonly int $scale) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ((! is_int($value) && ! is_string($value))
            || preg_match('/\A\d{1,'.$this->integerDigits.'}(?:\.\d{1,'.$this->scale.'})?\z/', (string) $value) !== 1) {
            $fail('El campo :attribute debe enviarse como texto decimal sin separadores de miles, con maximo '.$this->scale.' decimales.');
        }
    }
}
