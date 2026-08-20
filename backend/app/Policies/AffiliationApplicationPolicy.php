<?php

namespace App\Policies;

use App\Models\AffiliationApplication;
use App\Models\User;

class AffiliationApplicationPolicy
{
    public function startReview(User $user, AffiliationApplication $application): bool
    {
        return $this->canManageAffiliationBackoffice($user);
    }

    public function requestCorrection(User $user, AffiliationApplication $application): bool
    {
        return $this->canManageAffiliationBackoffice($user);
    }

    public function approve(User $user, AffiliationApplication $application): bool
    {
        return $this->canManageAffiliationBackoffice($user);
    }

    public function reject(User $user, AffiliationApplication $application): bool
    {
        return $this->canManageAffiliationBackoffice($user);
    }

    private function canManageAffiliationBackoffice(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }
}
