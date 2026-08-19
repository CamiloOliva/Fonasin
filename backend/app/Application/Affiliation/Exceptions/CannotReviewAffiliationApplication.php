<?php

namespace App\Application\Affiliation\Exceptions;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use DomainException;

class CannotReviewAffiliationApplication extends DomainException
{
    public static function invalidStatus(
        AffiliationApplicationStatus $status,
        AffiliationApplicationStatus $targetStatus,
    ): self {
        return new self("Applications in [{$status->value}] status cannot transition to [{$targetStatus->value}].");
    }

    public static function missingRejectionReason(): self
    {
        return new self('Application cannot be rejected without a rejection reason.');
    }
}
