<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsPayrollAuthorization;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Contributions\Enums\ContributionMovementType;
use App\Models\VoluntarySavingsRequest;
use DomainException;

class GenerateVoluntarySavingsPayrollAuthorization
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly RendersVoluntarySavingsPayrollAuthorization $renderer,
        private readonly StoresPrivateFiles $privateFiles,
    ) {}

    public function __invoke(VoluntarySavingsRequest $request): VoluntarySavingsRequest
    {
        $associate = $request->associate()->with('user:id,email')->first();

        if (! $associate) {
            throw new DomainException('La solicitud no tiene un asociado vinculado.');
        }

        $document = $this->cipher->decryptArray((string) $associate->getAttribute('document_number_encrypted'));
        $monthlyContribution = $associate->contributionMovements()
            ->where('movement_type', ContributionMovementType::Contribution->value)
            ->where('status', ContributionMovementStatus::Registered->value)
            ->latest('cut_off_date')
            ->latest('recorded_at')
            ->value('amount') ?? 0;
        $storageKey = "contributions/voluntary-savings/{$associate->id}/{$request->id}-libranza.pdf";
        $submittedAt = $request->submitted_at ?? now();
        $verificationCode = strtoupper(substr(hash('sha256', implode('|', [
            $request->id,
            $associate->id,
            $request->monthly_amount,
            $submittedAt->toISOString(),
        ])), 0, 16));
        $pdf = $this->renderer->render([
            'requestId' => $request->id,
            'fullName' => $associate->full_name,
            'documentType' => $associate->document_type,
            'documentNumber' => (string) ($document['document_number'] ?? ''),
            'email' => $associate->user?->email,
            'monthlyContribution' => (float) $monthlyContribution,
            'voluntarySavings' => (float) $request->monthly_amount,
            'totalMonthlyDeduction' => (float) $monthlyContribution + (float) $request->monthly_amount,
            'acceptedAt' => $submittedAt->timezone('America/Bogota')->format('Y-m-d H:i'),
            'verificationCode' => $verificationCode,
        ]);

        $this->privateFiles->put($storageKey, $pdf);
        $request->forceFill(['authorization_storage_key' => $storageKey])->save();

        return $request->refresh();
    }
}
