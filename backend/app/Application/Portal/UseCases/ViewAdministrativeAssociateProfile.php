<?php

namespace App\Application\Portal\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Portal\Enums\PortalAuditAction;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\ContributionMovement;
use App\Models\CreditAccount;
use App\Models\User;
use Throwable;

class ViewAdministrativeAssociateProfile
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly RecordAuditEvent $recordAuditEvent,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function __invoke(
        Associate $associate,
        User $actor,
        PortalAuditAction $action = PortalAuditAction::AssociateProfileViewed,
        ?string $ipHash = null,
    ): array {
        $associate->loadMissing('user:id,email,status');
        $application = $this->latestEnabledApplication($associate);
        $credits = $associate->creditAccounts()
            ->where('status', '!=', 'archived')
            ->orderByDesc('last_payment_date')
            ->orderBy('created_at')
            ->get();
        $account = $associate->contributionAccount()->first();
        $movements = $account
            ? $account->movements()->latest('period')->latest('recorded_at')->limit(100)->get()
            : collect();

        ($this->recordAuditEvent)(
            module: AuditModule::Portal,
            action: $action->value,
            subjectType: 'associate',
            subjectId: $associate->id,
            actor: $actor,
            actorType: AuditActorType::User,
            ipHash: $ipHash,
            metadata: [
                'scope' => 'admin',
                'form_state' => $application ? 'available' : 'empty',
                'credit_count' => $credits->count(),
                'contribution_state' => $account ? 'available' : 'empty',
            ],
        );

        return [
            'associate' => [
                'id' => $associate->id,
                'document_type' => $associate->document_type,
                'document_number' => $this->decryptedValue($associate->getAttribute('document_number_encrypted'), 'document_number'),
                'full_name' => $associate->full_name,
                'status' => $associate->status,
                'email' => $associate->user?->email,
                'user_status' => $associate->user?->status,
            ],
            'form' => [
                'state' => $application ? 'available' : 'empty',
                'application' => $application ? [
                    'id' => $application->id,
                    'purpose' => $application->purpose,
                    'status' => $application->status,
                    'submitted_at' => $application->submitted_at?->toJSON(),
                    'updated_at' => $application->updated_at?->toJSON(),
                    'sections' => $application->sections->map(fn (ApplicationSection $section): array => [
                        'section' => $section->section,
                        'schema_version' => $section->schema_version,
                        'data' => $this->decryptedSection($section),
                    ])->values()->all(),
                ] : null,
            ],
            'credits' => [
                'state' => $credits->isEmpty() ? 'empty' : 'available',
                'items' => $credits->map(fn (CreditAccount $credit): array => [
                    'id' => $credit->id,
                    'credit_line' => $credit->credit_line,
                    'promissory_note_number' => $this->decryptedValue($credit->getAttribute('promissory_note_number_encrypted'), 'promissory_note_number'),
                    'initial_balance' => $credit->initial_balance,
                    'installment_amount' => $credit->installment_amount,
                    'current_balance' => $credit->current_balance,
                    'last_payment_date' => $credit->last_payment_date?->toDateString(),
                    'status' => $credit->status,
                ])->values()->all(),
            ],
            'contributions' => [
                'state' => $account ? 'available' : 'empty',
                'account' => $account ? [
                    'id' => $account->id,
                    'contribution_balance' => $account->contribution_balance,
                    'permanent_savings_balance' => $account->permanent_savings_balance,
                    'voluntary_savings_balance' => $account->voluntary_savings_balance,
                    'total_balance' => $account->total_balance,
                    'status' => $account->status,
                    'last_period' => $account->last_period?->toDateString(),
                    'last_cut_off_date' => $account->last_cut_off_date?->toDateString(),
                ] : null,
                'movements' => $movements->map(fn (ContributionMovement $movement): array => [
                    'id' => $movement->id,
                    'movement_type' => $movement->movement_type,
                    'period' => $movement->period->toDateString(),
                    'cut_off_date' => $movement->cut_off_date->toDateString(),
                    'amount' => $movement->amount,
                    'balance_after' => $movement->balance_after,
                    'status' => $movement->status,
                    'reference' => $movement->reference,
                ])->values()->all(),
                'movement_count' => $account ? $account->movements()->count() : 0,
                'returned_movement_count' => $movements->count(),
            ],
            'generated_at' => now()->toJSON(),
        ];
    }

    private function latestEnabledApplication(Associate $associate): ?AffiliationApplication
    {
        return $associate->affiliationApplications()
            ->where('status', AffiliationApplicationStatus::Enabled->value)
            ->with(['sections' => fn ($query) => $query->orderBy('section')])
            ->latest('updated_at')
            ->first();
    }

    /** @return array<string, mixed> */
    private function decryptedSection(ApplicationSection $section): array
    {
        $encrypted = $section->getAttribute('data_encrypted');

        if (! is_string($encrypted) || $encrypted === '') {
            return [];
        }

        return $this->cipher->decryptArray($encrypted);
    }

    private function decryptedValue(mixed $encrypted, string $key): ?string
    {
        if (! is_string($encrypted) || $encrypted === '') {
            return null;
        }

        try {
            $value = $this->cipher->decryptArray($encrypted)[$key] ?? null;
        } catch (Throwable) {
            return null;
        }

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
