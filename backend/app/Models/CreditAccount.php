<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditAccount extends Model
{
    use HasUuids;

    protected $fillable = [
        'associate_id',
        'credit_line',
        'initial_balance',
        'current_balance',
        'term_months',
        'interest_rate',
        'installment_amount',
        'status',
        'registered_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'initial_balance' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'term_months' => 'integer',
            'interest_rate' => 'decimal:4',
            'installment_amount' => 'decimal:2',
        ];
    }

    public function associate(): BelongsTo
    {
        return $this->belongsTo(Associate::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by_user_id');
    }
}
