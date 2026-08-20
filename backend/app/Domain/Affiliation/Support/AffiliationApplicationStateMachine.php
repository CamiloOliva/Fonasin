<?php

namespace App\Domain\Affiliation\Support;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;

class AffiliationApplicationStateMachine
{
    /**
     * @return array<string, list<AffiliationApplicationStatus>>
     */
    public static function transitions(): array
    {
        return [
            AffiliationApplicationStatus::Draft->value => [
                AffiliationApplicationStatus::Submitted,
                AffiliationApplicationStatus::Cancelled,
            ],
            AffiliationApplicationStatus::Submitted->value => [
                AffiliationApplicationStatus::UnderReview,
            ],
            AffiliationApplicationStatus::UnderReview->value => [
                AffiliationApplicationStatus::PendingCorrection,
                AffiliationApplicationStatus::Approved,
                AffiliationApplicationStatus::Rejected,
            ],
            AffiliationApplicationStatus::PendingCorrection->value => [
                AffiliationApplicationStatus::Submitted,
                AffiliationApplicationStatus::Cancelled,
            ],
            AffiliationApplicationStatus::Approved->value => [
                AffiliationApplicationStatus::Enabled,
                AffiliationApplicationStatus::PendingCorrection,
            ],
            AffiliationApplicationStatus::Enabled->value => [
                AffiliationApplicationStatus::Disabled,
                AffiliationApplicationStatus::Withdrawn,
            ],
            AffiliationApplicationStatus::Disabled->value => [
                AffiliationApplicationStatus::Enabled,
                AffiliationApplicationStatus::Withdrawn,
            ],
            AffiliationApplicationStatus::Withdrawn->value => [],
            AffiliationApplicationStatus::Rejected->value => [],
            AffiliationApplicationStatus::Cancelled->value => [],
        ];
    }

    public function canTransition(
        AffiliationApplicationStatus $from,
        AffiliationApplicationStatus $to,
    ): bool {
        return in_array($to, self::transitions()[$from->value], true);
    }

    /**
     * @return list<AffiliationApplicationStatus>
     */
    public function allowedTransitionsFrom(AffiliationApplicationStatus $status): array
    {
        return self::transitions()[$status->value];
    }

    public function isTerminal(AffiliationApplicationStatus $status): bool
    {
        return $this->allowedTransitionsFrom($status) === [];
    }
}
