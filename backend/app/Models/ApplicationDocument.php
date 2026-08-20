<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocument extends Model
{
    use HasUuids;

    protected $fillable = [
        'application_id',
        'document_type',
        'original_filename',
        'mime_type',
        'byte_size',
        'status',
        'uploaded_at',
    ];

    protected $hidden = [
        'storage_key',
    ];

    protected function casts(): array
    {
        return [
            'byte_size' => 'integer',
            'uploaded_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(AffiliationApplication::class, 'application_id');
    }
}
