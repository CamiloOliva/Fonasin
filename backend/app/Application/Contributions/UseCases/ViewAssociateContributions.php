<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\Exceptions\CannotViewContributions;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Models\ContributionAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class ViewAssociateContributions
{
    public function __construct(
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @return array{
     *     state: 'module_disabled'|'empty'|'available',
     *     account: ContributionAccount|null,
     *     movements: Collection<int, \App\Models\ContributionMovement>
     * }
     */
    public function __invoke(
        User $actor,
        ?string $correlationId = null,
        ?string $ipHash = null,
    ): array {
        $associate = $actor->associate;

        if (! config('features.contributions.enabled', true)) {
            return [
                'state' => 'module_disabled',
                'account' => null,
                'movements' => new Collection(),
            ];
        }

        if (! $associate) {
            throw CannotViewContributions::associateAccountIsMissing();
        }

        if ($associate->status !== 'active') {
            throw CannotViewContributions::associateAccountIsInactive();
        }

        $account = $associate->contributionAccount()
            ->with(['movements' => fn ($query) => $query->latest('recorded_at')->limit(24)])
            ->first();
        $movements = $account?->movements ?? new Collection();
        $state = $account && $movements->isNotEmpty() ? 'available' : 'empty';

        ($this->recordAuditEvent)(
            module: AuditModule::Portal,
            action: ContributionAuditAction::ContributionViewed->value,
            subjectType: 'associate',
            subjectId: $associate->id,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId ?? (string) Str::uuid(),
            ipHash: $ipHash,
            metadata: [
                'state' => $state,
                'movement_count' => $movements->count(),
            ],
        );

        return [
            'state' => $state,
            'account' => $account,
            'movements' => $movements,
        ];
    }
}
