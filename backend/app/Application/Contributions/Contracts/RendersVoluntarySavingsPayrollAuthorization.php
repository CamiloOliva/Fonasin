<?php

namespace App\Application\Contributions\Contracts;

interface RendersVoluntarySavingsPayrollAuthorization
{
    /** @param array<string, mixed> $data */
    public function render(array $data): string;
}
