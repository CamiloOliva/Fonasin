<?php

namespace App\Domain\Contributions\Enums;

enum ContributionAuditAction: string
{
    case ContributionViewed = 'contribution.viewed';
}
