<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Identity\UseCases\CorrectAssociateUserEmail;
use App\Models\Associate;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CorrectAssociateEmail
{
    public function __construct(
        private readonly CorrectAssociateUserEmail $correctUserEmail,
        private readonly UpdateAssociateStatus $updateStatus,
    ) {}

    public function __invoke(Associate $associate, string $email, string $expectedEmail, User $actor, ?string $ipHash): Associate
    {
        return DB::transaction(function () use ($associate, $email, $expectedEmail, $actor, $ipHash): Associate {
            $locked = Associate::query()->lockForUpdate()->findOrFail($associate->id);
            if (! $locked->user_id) {
                throw new DomainException('El asociado no tiene una cuenta de acceso vinculada.');
            }
            $correlationId = (string) Str::uuid();
            ($this->correctUserEmail)($locked->user_id, $email, $expectedEmail, $actor, $correlationId, $ipHash);

            return ($this->updateStatus)($locked, 'inactive', $actor, $correlationId, $ipHash);
        });
    }
}
