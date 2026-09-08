<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionAccount extends Model
{
    use HasUuids;

    protected $fillable = [
        'associate_id',
        'permanent_savings_balance',
        'voluntary_savings_balance',
        'total_balance',
        'status',
        'last_period',
        'last_cut_off_date',
        'last_movement_at',
    ];

    protected function casts(): array
    {
        return [
            'permanent_savings_balance' => 'decimal:2',
            'voluntary_savings_balance' => 'decimal:2',
            'total_balance' => 'decimal:2',
            'last_period' => 'date',
            'last_cut_off_date' => 'date',
            'last_movement_at' => 'datetime',
        ];
    }

    public function associate(): BelongsTo
    {
        return $this->belongsTo(Associate::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(ContributionMovement::class);
    }
}
