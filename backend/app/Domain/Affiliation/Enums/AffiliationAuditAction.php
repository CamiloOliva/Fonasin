<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationAuditAction: string
{
    case ApplicationSubmitted = 'application.submitted';
}
