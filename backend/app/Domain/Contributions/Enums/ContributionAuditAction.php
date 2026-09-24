<?php

namespace App\Domain\Contributions\Enums;

enum ContributionAuditAction: string
{
    case ContributionViewed = 'contribution.viewed';
    case ContributionAccountCollectionViewed = 'contribution.account_collection.viewed';
    case ContributionMovementCollectionViewed = 'contribution.movement_collection.viewed';
    case VoluntarySavingsRequested = 'contribution.voluntary_savings.requested';
    case VoluntarySavingsRequestViewed = 'contribution.voluntary_savings_request.viewed';
    case VoluntarySavingsRequestReviewed = 'contribution.voluntary_savings_request.reviewed';
    case VoluntarySavingsPayrollAuthorizationViewed = 'contribution.voluntary_savings_payroll_authorization.viewed';
    case VoluntarySavingsPayrollAuthorizationDownloaded = 'contribution.voluntary_savings_payroll_authorization.downloaded';
    case VoluntarySavingsSignedAuthorizationUploaded = 'contribution.voluntary_savings_signed_authorization.uploaded';
    case VoluntarySavingsSignedAuthorizationViewed = 'contribution.voluntary_savings_signed_authorization.viewed';
    case VoluntarySavingsSignedAuthorizationDownloaded = 'contribution.voluntary_savings_signed_authorization.downloaded';
}
