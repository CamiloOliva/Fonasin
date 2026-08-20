<?php

namespace App\Domain\Affiliation\Enums;

enum ApplicationDocumentType: string
{
    case Identity = 'identity';

    /**
     * @return list<self>
     */
    public static function requiredForSubmission(): array
    {
        return [
            self::Identity,
        ];
    }
}
