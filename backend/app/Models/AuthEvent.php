<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuthEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $guarded = ['*'];

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

    protected static function booted(): void
    {
        static::updating(function (): void {
            throw new LogicException('Authentication events are immutable.');
        });

        static::deleting(function (): void {
            throw new LogicException('Authentication events are immutable.');
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
