<?php

namespace App\Domain\Credits\Enums;

enum CreditAuditAction: string
{
    case CreditRegistered = 'credit.registered';
    case CreditUpdated = 'credit.updated';
    case CreditArchived = 'credit.archived';
    case CreditViewed = 'credit.viewed';
}
