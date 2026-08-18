<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationSection extends Model
{
    use HasUuids;

    protected $fillable = [
        'application_id',
        'section',
        'schema_version',
        'data_encrypted',
        'completed_at',
    ];

    protected $hidden = [
        'data_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'schema_version' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(AffiliationApplication::class, 'application_id');
    }
}
