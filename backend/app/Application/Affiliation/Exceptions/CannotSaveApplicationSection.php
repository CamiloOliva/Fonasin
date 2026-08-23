<?php

namespace App\Application\Affiliation\Exceptions;

use DomainException;

class CannotSaveApplicationSection extends DomainException
{
    public static function unsupportedSection(string $section): self
    {
        return new self("The [{$section}] step is not persisted as an application section.");
    }

    /**
     * @param  list<string>  $fields
     */
    public static function missingRequiredFields(string $section, array $fields): self
    {
        return new self(sprintf(
            'The [%s] section cannot be completed because required fields are missing: %s.',
            $section,
            implode(', ', $fields),
        ));
    }

    public static function invalidField(string $section, string $field, string $reason): self
    {
        return new self("The [{$section}] section has an invalid [{$field}] field: {$reason}.");
    }
}
