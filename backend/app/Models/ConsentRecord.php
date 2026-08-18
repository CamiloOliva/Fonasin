<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsentRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'application_id',
        'consent_type',
        'policy_version',
        'accepted_at',
        'ip_hash',
    ];

    protected $hidden = [
        'ip_hash',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(AffiliationApplication::class, 'application_id');
    }
}
