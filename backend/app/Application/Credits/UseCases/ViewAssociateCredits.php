<?php

namespace App\Application\Credits\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Credits\Exceptions\CannotManageCreditAccount;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Credits\Enums\CreditAuditAction;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class ViewAssociateCredits
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @return Collection<int, \App\Models\CreditAccount>
     */
    public function __invoke(
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): Collection {
        $associate = $actor->associate;

        if (! $associate) {
            throw CannotManageCreditAccount::associateAccountIsMissing();
        }

        if ($associate->status !== 'active') {
            throw CannotManageCreditAccount::associateAccountIsInactive();
        }

        $credits = $associate->creditAccounts()
            ->where('status', '!=', 'archived')
            ->orderBy('created_at')
            ->get();

        ($this->recordAuditEvent)(
            module: AuditModule::Portal,
            action: CreditAuditAction::CreditViewed->value,
            subjectType: 'associate',
            subjectId: $associate->id,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId ?? (string) Str::uuid(),
            ipHash: $ipHash,
            metadata: [
                'credit_count' => $credits->count(),
            ],
        );

        return $credits;
    }
}
