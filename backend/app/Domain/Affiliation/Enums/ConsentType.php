<?php

namespace App\Domain\Affiliation\Enums;

enum ConsentType: string
{
    case DataProcessing = 'data_processing';
    case Bylaws = 'bylaws';
}
