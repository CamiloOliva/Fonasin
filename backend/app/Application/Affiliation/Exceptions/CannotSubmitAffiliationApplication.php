<?php

namespace App\Application\Affiliation\Exceptions;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ConsentType;
use DomainException;

class CannotSubmitAffiliationApplication extends DomainException
{
    public static function invalidStatus(AffiliationApplicationStatus $status): self
    {
        return new self("Applications in [{$status->value}] status cannot be submitted.");
    }

    /**
     * @param  list<AffiliationApplicationStep>  $missingSections
     */
    public static function missingSections(array $missingSections): self
    {
        $sections = implode(', ', array_map(
            fn (AffiliationApplicationStep $section): string => $section->value,
            $missingSections,
        ));

        return new self("Application cannot be submitted because sections are missing: {$sections}.");
    }

    /**
     * @param  list<ConsentType>  $missingConsents
     */
    public static function missingConsents(array $missingConsents): self
    {
        $consents = implode(', ', array_map(
            fn (ConsentType $consentType): string => $consentType->value,
            $missingConsents,
        ));

        return new self("Application cannot be submitted because consents are missing: {$consents}.");
    }
}
