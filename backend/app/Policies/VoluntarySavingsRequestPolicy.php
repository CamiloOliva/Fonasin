<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VoluntarySavingsRequest;

class VoluntarySavingsRequestPolicy
{
    public function viewOwn(User $user, VoluntarySavingsRequest $request): bool
    {
        $associate = $user->associate;

        return $user->hasRole('associate')
            && $associate !== null
            && $associate->status === 'active'
            && $request->associate_id === $associate->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'reviewer']);
    }

    public function view(User $user, VoluntarySavingsRequest $request): bool
    {
        return $this->viewAny($user);
    }

    public function review(User $user, VoluntarySavingsRequest $request): bool
    {
        return $user->hasRole('admin');
    }

    public function uploadSignedAuthorization(User $user, VoluntarySavingsRequest $request): bool
    {
        return $user->hasRole('admin');
    }
}
