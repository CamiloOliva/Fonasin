<?php

namespace App\Application\Identity\UseCases;

use App\Models\User;

class LockPasswordRecoveryUser
{
    /** Must run inside the recovery transaction. Lock the primary key first. */
    public function __invoke(string $email): ?User
    {
        $id = User::query()->where('email', $email)->value('id');
        $user = $id ? User::query()->lockForUpdate()->find($id) : null;

        // The email may have changed while waiting for the row lock.
        return $user && strcasecmp($user->email, $email) === 0 ? $user : null;
    }
}
