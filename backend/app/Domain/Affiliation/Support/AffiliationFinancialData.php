<?php

namespace App\Domain\Affiliation\Support;

final class AffiliationFinancialData
{
    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public static function forForm(array $data, bool $formOnly): array
    {
        if ($formOnly) {
            unset($data['voluntarySavings'], $data['voluntarySavingsValue']);
        }

        return $data;
    }
}
