<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
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
            ->lockForUpdate()
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
        $totalCents = array_sum(array_map(
            fn (string $value): int => (int) str_replace('.', '', $value),
            [$contributionBalance, $permanentBalance, $voluntaryBalance],
        ));
        if ($totalCents > 99999999999999) {
            throw CannotImportSpreadsheet::invalidFile('El saldo consolidado supera 999999999999.99 pesos. No se aplico el lote.');
        }

        $account->forceFill([
            'contribution_balance' => $contributionBalance,
            'permanent_savings_balance' => $permanentBalance,
            'voluntary_savings_balance' => $voluntaryBalance,
            'total_balance' => intdiv($totalCents, 100).'.'.str_pad((string) ($totalCents % 100), 2, '0', STR_PAD_LEFT),
            'last_period' => $latest?->period,
            'last_cut_off_date' => $latest?->cut_off_date,
            'last_movement_at' => $movements->max('recorded_at'),
        ])->save();

        return $account->refresh();
    }
}
