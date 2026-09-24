<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoluntarySavingsRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'associate_id',
        'monthly_amount',
        'status',
        'authorization_storage_key',
        'signed_authorization_storage_key',
        'signed_authorization_uploaded_at',
        'signed_authorization_uploaded_by_user_id',
        'submitted_at',
        'reviewed_at',
        'reviewed_by_user_id',
        'review_notes',
    ];

    protected $hidden = [
        'authorization_storage_key',
        'signed_authorization_storage_key',
    ];

    protected function casts(): array
    {
        return [
            'monthly_amount' => 'decimal:2',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'signed_authorization_uploaded_at' => 'datetime',
        ];
    }

    public function associate(): BelongsTo
    {
        return $this->belongsTo(Associate::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
