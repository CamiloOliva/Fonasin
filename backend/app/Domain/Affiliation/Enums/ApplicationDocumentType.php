<?php

namespace App\Domain\Affiliation\Enums;

enum ApplicationDocumentType: string
{
    case Identity = 'identity';
    case AffiliationSummary = 'affiliation_summary';
    case PayrollAuthorization = 'payroll_authorization';
    case SignedPayrollAuthorization = 'signed_payroll_authorization';

    /**
     * @return list<self>
     */
    public static function requiredForSubmission(): array
    {
        return [
            self::Identity,
        ];
    }
}
