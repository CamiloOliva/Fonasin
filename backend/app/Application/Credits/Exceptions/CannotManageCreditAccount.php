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
}
