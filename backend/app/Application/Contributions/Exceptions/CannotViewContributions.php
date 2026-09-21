<?php

namespace App\Application\Contributions\Exceptions;

use DomainException;

class CannotViewContributions extends DomainException
{
    public static function associateAccountIsMissing(): self
    {
        return new self('User does not have an associate profile.');
    }

    public static function associateAccountIsInactive(): self
    {
        return new self('Associate account is inactive.');
    }
}
