<?php

namespace App\Application\Identity\UseCases;

use App\Models\User;

class ResolvePasswordLinkLifetime
{
    public function __invoke(User $user): int
    {
        if ($user->hasRole('associate') && ! $user->hasAnyRole(['admin', 'reviewer'])) {
            return (int) config('auth.passwords.users.expire', 1440);
        }

        return (int) config('auth.passwords.users.staff_expire', 120);
    }
}
