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

    public function isFormSection(): bool
    {
        return in_array($this, self::formSections(), true);
    }

    /**
     * @return list<self>
     */
    public static function formSections(): array
    {
        return [
            self::Personal,
            self::Employment,
            self::Financial,
            self::Beneficiaries,
            self::Sarlaft,
        ];
    }
}
