<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Associate extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'document_type',
        'document_number_hash',
        'document_number_encrypted',
        'full_name',
        'status',
    ];

    protected $hidden = [
        'document_number_hash',
        'document_number_encrypted',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function affiliationApplications(): HasMany
    {
        return $this->hasMany(AffiliationApplication::class);
    }

    public function creditAccounts(): HasMany
    {
        return $this->hasMany(CreditAccount::class);
    }

    public function contributionAccount(): HasOne
    {
        return $this->hasOne(ContributionAccount::class);
    }

    public function contributionMovements(): HasMany
    {
        return $this->hasMany(ContributionMovement::class);
    }
}
