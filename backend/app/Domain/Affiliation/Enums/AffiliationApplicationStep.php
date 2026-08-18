<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationApplicationStep: string
{
    case Personal = 'personal';
    case Employment = 'employment';
    case Financial = 'financial';
    case Beneficiaries = 'beneficiaries';
    case Sarlaft = 'sarlaft';
    case Documents = 'documents';
    case Consents = 'consents';
    case Summary = 'summary';
}
