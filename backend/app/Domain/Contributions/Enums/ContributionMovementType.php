<?php

namespace App\Domain\Contributions\Enums;

enum ContributionMovementType: string
{
    case PermanentSavings = 'permanent_savings';
    case VoluntarySavings = 'voluntary_savings';
    case Contribution = 'contribution';
    case Adjustment = 'adjustment';
}
