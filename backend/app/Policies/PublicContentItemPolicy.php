<?php

namespace App\Policies;

use App\Models\PublicContentItem;
use App\Models\User;

class PublicContentItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }

    public function manage(User $user, ?PublicContentItem $item = null): bool
    {
        return $user->hasRole('admin');
    }
}
