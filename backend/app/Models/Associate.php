<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
