<?php

namespace App\Domain\Contributions\Enums;

enum ContributionAuditAction: string
{
    case ContributionViewed = 'contribution.viewed';
    case ContributionAccountCollectionViewed = 'contribution.account_collection.viewed';
    case ContributionMovementCollectionViewed = 'contribution.movement_collection.viewed';
}
