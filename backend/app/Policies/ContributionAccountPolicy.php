<?php

namespace App\Policies;

use App\Models\User;

class ContributionAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }

    public function import(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
