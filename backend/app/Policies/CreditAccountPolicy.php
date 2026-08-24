<?php

namespace App\Policies;

use App\Models\CreditAccount;
use App\Models\User;

class CreditAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManageCredits($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageCredits($user);
    }

    public function update(User $user, CreditAccount $credit): bool
    {
        return $this->canManageCredits($user);
    }

    public function archive(User $user, CreditAccount $credit): bool
    {
        return $this->canManageCredits($user);
    }

    private function canManageCredits(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }
}
