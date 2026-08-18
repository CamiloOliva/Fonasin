<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuthEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'occurred_at',
        'user_id',
        'event_type',
        'email_hash',
        'ip_hash',
        'user_agent_hash',
        'correlation_id',
        'metadata',
    ];

    protected $hidden = [
        'email_hash',
        'ip_hash',
        'user_agent_hash',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
