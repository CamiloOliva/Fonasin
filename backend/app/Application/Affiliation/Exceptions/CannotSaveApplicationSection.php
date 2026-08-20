<?php

namespace App\Application\Affiliation\Exceptions;

use DomainException;

class CannotSaveApplicationSection extends DomainException
{
    public static function unsupportedSection(string $section): self
    {
        return new self("The [{$section}] step is not persisted as an application section.");
    }
}
