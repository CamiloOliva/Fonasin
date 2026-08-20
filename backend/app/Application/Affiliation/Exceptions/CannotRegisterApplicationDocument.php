<?php

namespace App\Application\Affiliation\Exceptions;

use DomainException;

class CannotRegisterApplicationDocument extends DomainException
{
    public static function invalidByteSize(int $byteSize): self
    {
        return new self("Application document byte size must be greater than zero; [{$byteSize}] given.");
    }

    public static function invalidMimeType(string $mimeType): self
    {
        return new self("Application document mime type [{$mimeType}] is not allowed.");
    }
}
