<?php

namespace App\Application\Contributions\UseCases;

use App\Models\ContributionAccount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ListContributionAccounts
{
    /**
     * @param  array{associate_id?: string|null, status?: string|null, period?: string|null}  $filters
     * @return LengthAwarePaginator<ContributionAccount>
     */
    public function __invoke(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = ContributionAccount::query()
            ->with('associate:id,full_name,document_type,status')
            ->withCount('movements');

        if ($associateId = $filters['associate_id'] ?? null) {
            $query->where('associate_id', $associateId);
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($period = $filters['period'] ?? null) {
            $periodStart = Carbon::createFromFormat('!Y-m', $period)->startOfMonth();
            $query->whereHas('movements', fn ($movements) => $movements
                ->whereBetween('period', [$periodStart->toDateString(), $periodStart->copy()->endOfMonth()->toDateString()]));
        }

        return $query
            ->orderByDesc('last_period')
            ->orderByDesc('last_movement_at')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
