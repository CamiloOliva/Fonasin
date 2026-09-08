<?php

namespace App\Application\Imports\Contracts;

interface ReadsSpreadsheetRows
{
    /**
     * @return array<int, array<string, string>>
     */
    public function read(string $path): array;
}
