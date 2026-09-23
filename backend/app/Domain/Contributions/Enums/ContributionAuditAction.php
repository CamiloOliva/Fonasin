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
    case VoluntarySavingsAuthorizationViewed = 'contribution.voluntary_savings_authorization.viewed';
}
