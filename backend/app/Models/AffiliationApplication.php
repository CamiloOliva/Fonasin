<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliationApplication extends Model
{
    use HasUuids;

    protected $fillable = [
        'associate_id',
        'status',
        'current_step',
        'access_token_hash',
        'submitted_at',
        'reviewed_by_user_id',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $hidden = [
        'access_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function associate(): BelongsTo
    {
        return $this->belongsTo(Associate::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(ApplicationSection::class, 'application_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class, 'application_id');
    }

    public function consentRecords(): HasMany
    {
        return $this->hasMany(ConsentRecord::class, 'application_id');
    }
}
