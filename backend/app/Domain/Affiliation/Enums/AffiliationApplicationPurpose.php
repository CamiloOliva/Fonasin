<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationApplicationPurpose: string
{
    case InitialAffiliation = 'initial_affiliation';
    case DataUpdate = 'data_update';
}
