<?php

namespace App\Policies;

use App\Models\Associate;
use App\Models\User;

class AssociatePolicy
{
    public function viewSensitiveProfiles(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function viewProfile(User $user, Associate $associate): bool
    {
        return $this->viewSensitiveProfiles($user);
    }

    public function exportProfile(User $user, Associate $associate): bool
    {
        return $this->viewSensitiveProfiles($user);
    }

    public function viewAny(User $user): bool
    {
        return $this->canManageAssociates($user);
    }

    public function create(User $user): bool
    {
        return $this->canManageAssociates($user);
    }

    public function updateStatus(User $user, Associate $associate): bool
    {
        return $this->canManageAssociates($user);
    }

    public function sendActivation(User $user, Associate $associate): bool
    {
        return $user->hasRole('admin');
    }

    private function canManageAssociates(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }
}
