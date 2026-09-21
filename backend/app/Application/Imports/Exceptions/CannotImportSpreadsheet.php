<?php

namespace App\Application\Imports\Exceptions;

use DomainException;

class CannotImportSpreadsheet extends DomainException
{
    public static function duplicateFile(): self
    {
        return new self('Este archivo ya fue importado para este tipo de carga.');
    }

    public static function invalidFile(string $message): self
    {
        return new self($message);
    }
}
