<?php

namespace App\Domain\Affiliation\Enums;

enum ConsentType: string
{
    case DataProcessing = 'data_processing';
    case Bylaws = 'bylaws';

    /**
     * @return list<self>
     */
    public static function requiredForSubmission(): array
    {
        return [
            self::DataProcessing,
            self::Bylaws,
        ];
    }
}
