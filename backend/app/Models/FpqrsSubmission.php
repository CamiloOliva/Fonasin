<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FpqrsSubmission extends Model
{
    use HasUuids;

    protected $fillable = [
        'full_name',
        'email',
        'submission_type',
        'message',
    ];

    protected $hidden = [
        'email',
        'email_hash',
        'message',
        'attachment_storage_key',
        'ip_hash',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }
}
