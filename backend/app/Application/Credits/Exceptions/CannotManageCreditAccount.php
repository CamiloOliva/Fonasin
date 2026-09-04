<?php

namespace App\Application\Credits\Exceptions;

use DomainException;

class CannotManageCreditAccount extends DomainException
{
    public static function archivedCreditCannotBeUpdated(): self
    {
        return new self('Archived credit accounts cannot be updated.');
    }

    public static function associateAccountIsMissing(): self
    {
        return new self('Authenticated user is not linked to an associate account.');
    }

    public static function associateAccountIsInactive(): self
    {
        return new self('El asociado no se encuentra activo.');
    }

    public static function associateMustBeActive(): self
    {
        return new self('Solo se pueden registrar creditos para asociados activos.');
    }
}
