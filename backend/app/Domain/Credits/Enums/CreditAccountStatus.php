<?php

namespace App\Domain\Credits\Enums;

enum CreditAccountStatus: string
{
    case Active = 'active';
    case Settled = 'settled';
    case Archived = 'archived';
}
