<?php

namespace App\Application\Contributions\Contracts;

interface RendersVoluntarySavingsAuthorization
{
    /** @param array<string, mixed> $data */
    public function render(array $data): string;
}
