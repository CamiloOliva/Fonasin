<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
