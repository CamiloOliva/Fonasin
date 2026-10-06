<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PublicContentItem extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['image_storage_key', 'document_storage_key'];

    protected function casts(): array
    {
        return ['published' => 'boolean', 'published_at' => 'datetime', 'sort_order' => 'integer'];
    }
}
