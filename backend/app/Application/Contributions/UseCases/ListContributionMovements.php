<?php

namespace App\Application\Contributions\UseCases;

use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ListContributionMovements
{
    /**
     * @param  array{movement_type?: string|null, status?: string|null, period?: string|null}  $filters
     * @return LengthAwarePaginator<ContributionMovement>
     */
    public function __invoke(ContributionAccount $account, array $filters, int $perPage): LengthAwarePaginator
    {
        $query = $account->movements()->with('recordedBy:id,email');

        if ($movementType = $filters['movement_type'] ?? null) {
            $query->where('movement_type', $movementType);
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($period = $filters['period'] ?? null) {
            $periodStart = Carbon::createFromFormat('!Y-m', $period)->startOfMonth();
            $query->whereBetween('period', [$periodStart->toDateString(), $periodStart->copy()->endOfMonth()->toDateString()]);
        }

        return $query
            ->orderByDesc('period')
            ->orderByDesc('cut_off_date')
            ->orderByDesc('recorded_at')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
