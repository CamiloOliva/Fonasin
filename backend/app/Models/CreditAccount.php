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
        'promissory_note_number_hash',
        'promissory_note_number_encrypted',
        'initial_balance',
        'current_balance',
        'term_months',
        'interest_rate',
        'installment_amount',
        'last_payment_date',
        'status',
        'registered_by_user_id',
    ];

    protected $hidden = [
        'promissory_note_number_hash',
        'promissory_note_number_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'initial_balance' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'term_months' => 'integer',
            'interest_rate' => 'decimal:4',
            'installment_amount' => 'decimal:2',
            'last_payment_date' => 'date',
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
