<?php

namespace App\Application\Affiliation\Exceptions;

use DomainException;

class CannotManageAssociate extends DomainException
{
    public static function duplicateDocument(): self
    {
        return new self('Ya existe un asociado con ese numero de documento.');
    }

    public static function invalidStatus(string $status): self
    {
        return new self("El estado de asociado [{$status}] no es valido.");
    }
}
