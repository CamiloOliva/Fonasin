<?php

namespace App\Domain\Contributions\Enums;

enum ContributionAccountStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}
