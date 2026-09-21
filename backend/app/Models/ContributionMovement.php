<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContributionMovement extends Model
{
    use HasUuids;

    protected $fillable = [
        'contribution_account_id',
        'associate_id',
        'import_batch_id',
        'recorded_by_user_id',
        'movement_type',
        'period',
        'cut_off_date',
        'amount',
        'balance_after',
        'status',
        'source',
        'reference',
        'source_row_hash',
        'recorded_at',
    ];

    protected $hidden = [
        'source_row_hash',
    ];

    protected static function booted(): void
    {
        static::creating(function (ContributionMovement $movement): void {
            $movement->id ??= (string) Str::uuid();

            if (! $movement->source_row_hash) {
                $movement->source_row_hash = hash('sha256', implode('|', [
                    'movement',
                    $movement->id,
                    $movement->associate_id,
                    $movement->movement_type,
                    $movement->period,
                    $movement->reference,
                ]));
            }
        });
    }

    protected function casts(): array
    {
        return [
            'period' => 'date',
            'cut_off_date' => 'date',
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ContributionAccount::class, 'contribution_account_id');
    }

    public function associate(): BelongsTo
    {
        return $this->belongsTo(Associate::class);
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
