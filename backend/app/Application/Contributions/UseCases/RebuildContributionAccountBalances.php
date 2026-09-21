<?php

namespace App\Application\Contributions\UseCases;

use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Contributions\Enums\ContributionMovementType;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;

class RebuildContributionAccountBalances
{
    public function __invoke(ContributionAccount $account): ContributionAccount
    {
        $movements = $account->movements()
            ->where('status', ContributionMovementStatus::Registered->value)
            ->orderByDesc('period')
            ->orderByDesc('cut_off_date')
            ->orderByDesc('reference')
            ->orderByDesc('id')
            ->get();

        $permanent = $movements->firstWhere(
            'movement_type',
            ContributionMovementType::PermanentSavings->value,
        );
        $voluntary = $movements->firstWhere(
            'movement_type',
            ContributionMovementType::VoluntarySavings->value,
        );
        $contribution = $movements->firstWhere(
            'movement_type',
            ContributionMovementType::Contribution->value,
        );
        /** @var ContributionMovement|null $latest */
        $latest = $movements->first();

        $contributionBalance = $contribution?->balance_after ?? '0.00';
        $permanentBalance = $permanent?->balance_after ?? '0.00';
        $voluntaryBalance = $voluntary?->balance_after ?? '0.00';

        $account->forceFill([
            'contribution_balance' => $contributionBalance,
            'permanent_savings_balance' => $permanentBalance,
            'voluntary_savings_balance' => $voluntaryBalance,
            'total_balance' => number_format(
                (float) $contributionBalance + (float) $permanentBalance + (float) $voluntaryBalance,
                2,
                '.',
                '',
            ),
            'last_period' => $latest?->period,
            'last_cut_off_date' => $latest?->cut_off_date,
            'last_movement_at' => $movements->max('recorded_at'),
        ])->save();

        return $account->refresh();
    }
}
