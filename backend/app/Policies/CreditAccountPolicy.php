<?php

namespace App\Policies;

use App\Models\CreditAccount;
use App\Models\User;

class CreditAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, CreditAccount $credit): bool
    {
        return $user->hasRole('admin');
    }

    public function archive(User $user, CreditAccount $credit): bool
    {
        return $user->hasRole('admin');
    }
}
