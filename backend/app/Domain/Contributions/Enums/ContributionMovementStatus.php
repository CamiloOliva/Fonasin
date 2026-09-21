<?php

namespace App\Domain\Contributions\Enums;

enum ContributionMovementStatus: string
{
    case Registered = 'registered';
    case Reversed = 'reversed';
}
