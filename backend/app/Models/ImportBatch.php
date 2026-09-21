<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportBatch extends Model
{
    use HasUuids;

    protected $fillable = [
        'imported_by_user_id',
        'import_type',
        'original_filename',
        'storage_key',
        'file_hash',
        'mime_type',
        'byte_size',
        'status',
        'rows_total',
        'rows_created',
        'rows_updated',
        'rows_rejected',
        'errors',
        'started_at',
        'completed_at',
    ];

    protected $hidden = [
        'storage_key',
        'file_hash',
    ];

    protected function casts(): array
    {
        return [
            'byte_size' => 'integer',
            'rows_total' => 'integer',
            'rows_created' => 'integer',
            'rows_updated' => 'integer',
            'rows_rejected' => 'integer',
            'errors' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function importedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by_user_id');
    }

    public function contributionMovements(): HasMany
    {
        return $this->hasMany(ContributionMovement::class);
    }
}
