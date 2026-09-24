<?php

namespace App\Application\Contributions\UseCases;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsPayrollAuthorization;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\AffiliationApplication;
use App\Models\VoluntarySavingsRequest;
use DomainException;
use Illuminate\Support\Carbon;

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
        $sections = $this->latestProfileSections($associate->affiliationApplications()
            ->whereIn('status', [
                AffiliationApplicationStatus::Enabled->value,
                AffiliationApplicationStatus::Approved->value,
            ])
            ->latest('submitted_at')
            ->first());
        $personal = $sections[AffiliationApplicationStep::Personal->value] ?? [];
        $employment = $sections[AffiliationApplicationStep::Employment->value] ?? [];
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
            'issuePlace' => (string) ($personal['issuePlace'] ?? ''),
            'employer' => (string) ($employment['employer'] ?? ''),
            'phone' => (string) ($personal['mobile'] ?? ''),
            'email' => (string) ($personal['email'] ?? $associate->user?->email ?? ''),
            'monthlySalary' => $this->numberValue($employment['monthlySalary'] ?? null),
            'voluntarySavings' => (float) $request->monthly_amount,
            'totalMonthlyDeduction' => (float) $request->monthly_amount,
            'city' => 'Bucaramanga',
            'signatureDateLabel' => $this->spanishDate($submittedAt),
            'acceptedAt' => $submittedAt->copy()->timezone('America/Bogota')->format('Y-m-d H:i:s'),
            'verificationCode' => $verificationCode,
        ]);

        $this->privateFiles->put($storageKey, $pdf);
        $request->forceFill(['authorization_storage_key' => $storageKey])->save();

        return $request->refresh();
    }

    /** @return array<string, array<string, mixed>> */
    private function latestProfileSections(?AffiliationApplication $application): array
    {
        if (! $application) {
            return [];
        }

        return $application->sections()
            ->whereIn('section', [
                AffiliationApplicationStep::Personal->value,
                AffiliationApplicationStep::Employment->value,
            ])
            ->get()
            ->mapWithKeys(fn ($section): array => [
                $section->section => $this->cipher->decryptArray((string) $section->getAttribute('data_encrypted')),
            ])
            ->all();
    }

    private function numberValue(mixed $value): float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return 0.0;
        }

        $normalized = preg_replace('/[^\d.-]/', '', $value);

        return $normalized !== null && is_numeric($normalized) ? (float) $normalized : 0.0;
    }

    private function spanishDate(Carbon $date): string
    {
        $months = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];
        $localDate = $date->copy()->timezone('America/Bogota');

        return sprintf('%d de %s de %d', (int) $localDate->format('j'), $months[(int) $localDate->format('n')], (int) $localDate->format('Y'));
    }
}
