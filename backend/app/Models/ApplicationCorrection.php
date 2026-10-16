<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ApplicationCorrection extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['reason_encrypted'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'revoked_at' => 'datetime', 'completed_at' => 'datetime'];
    }
}
