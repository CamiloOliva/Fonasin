<?php

namespace App\Policies;

use App\Models\ContributionAccount;
use App\Models\User;

class ContributionAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }

    public function view(User $user, ContributionAccount $account): bool
    {
        return $this->viewAny($user);
    }

    public function import(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
