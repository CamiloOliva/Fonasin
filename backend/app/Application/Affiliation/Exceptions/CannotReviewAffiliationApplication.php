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

    public static function missingSignedPayrollAuthorization(): self
    {
        return new self('Application cannot be enabled without signed payroll authorization.');
    }

    public static function missingPersonalSection(): self
    {
        return new self('Application cannot create an associate without completed personal data.');
    }

    public static function missingPersonalField(string $field): self
    {
        return new self("Application cannot create an associate because personal field [{$field}] is missing.");
    }

    public static function identityConflict(): self
    {
        return new self('No se puede habilitar la afiliacion porque el correo o documento ya pertenece a otra identidad.');
    }
}
