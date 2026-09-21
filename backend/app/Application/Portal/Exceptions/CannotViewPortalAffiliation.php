<?php

namespace App\Application\Portal\Exceptions;

use DomainException;

class CannotViewPortalAffiliation extends DomainException
{
    public static function associateAccountIsMissing(): self
    {
        return new self('El usuario autenticado no tiene un asociado vinculado.');
    }

    public static function associateAccountIsInactive(): self
    {
        return new self('El asociado no se encuentra activo.');
    }

    public static function enabledApplicationIsMissing(): self
    {
        return new self('No hay una afiliacion habilitada para actualizar.');
    }
}
