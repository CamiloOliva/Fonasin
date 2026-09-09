<?php

namespace App\Application\Portal\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Contributions\UseCases\ViewAssociateContributions;
use App\Application\Credits\UseCases\ViewAssociateCredits;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Portal\Enums\PortalAuditAction;
use App\Models\User;
use Illuminate\Support\Collection;

class ViewAssociateAccountStatement
{
    public function __construct(
        private readonly ViewAssociateCredits $viewAssociateCredits,
        private readonly ViewAssociateContributions $viewAssociateContributions,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {
    }

    /**
     * @return array{
     *     state: string,
     *     generated_at: string,
     *     credits: array{state: string, items: Collection<int, \App\Models\CreditAccount>},
     *     contributions: array{state: string, account: \App\Models\ContributionAccount|null, movements: Collection<int, \App\Models\ContributionMovement>}
     * }
     */
    public function __invoke(User $actor, ?string $ipHash = null): array
    {
        $credits = ($this->viewAssociateCredits)($actor, $ipHash);
        $contributions = ($this->viewAssociateContributions)($actor, $ipHash);
        $hasCredits = $credits->isNotEmpty();
        $hasContributions = $contributions['state'] === 'available';

        ($this->recordAuditEvent)(
            module: AuditModule::Portal,
            action: PortalAuditAction::AccountStatementViewed->value,
            subjectType: 'associate',
            subjectId: (string) $actor->associate->id,
            actor: $actor,
            actorType: AuditActorType::User,
            ipHash: $ipHash,
            metadata: [
                'credits_state' => $hasCredits ? 'available' : 'empty',
                'contributions_state' => $contributions['state'],
            ],
        );

        return [
            'state' => $hasCredits || $hasContributions ? 'available' : 'empty',
            'generated_at' => now()->toISOString(),
            'credits' => [
                'state' => $hasCredits ? 'available' : 'empty',
                'items' => $credits,
            ],
            'contributions' => $contributions,
        ];
    }
}
