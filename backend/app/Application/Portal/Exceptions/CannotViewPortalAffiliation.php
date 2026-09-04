<?php

namespace App\Application\Portal\Exceptions;

use DomainException;

class CannotViewPortalAffiliation extends DomainException
{
    public static function associateAccountIsMissing(): self
    {
        return new self('El usuario autenticado no tiene un asociado vinculado.');
    }
}
