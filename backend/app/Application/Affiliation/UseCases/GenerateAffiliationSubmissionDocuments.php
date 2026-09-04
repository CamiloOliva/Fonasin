<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Contracts\RendersAffiliationSubmissionDocuments;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\User;
use Illuminate\Support\Carbon;

class GenerateAffiliationSubmissionDocuments
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly RendersAffiliationSubmissionDocuments $renderer,
        private readonly RegisterApplicationDocument $registerDocument,
    ) {}

    /**
     * @return array{summary: ApplicationDocument, payroll_authorization: ApplicationDocument}
     */
    public function __invoke(
        AffiliationApplication $application,
        ?User $actor = null,
        ?string $correlationId = null,
        ?string $ipHash = null,
        ?Carbon $generatedAt = null,
        ?string $signatureCity = null,
        ?string $signatureDate = null,
    ): array {
        $sections = $this->decryptedSections($application);
        $generatedAt ??= now();
        $signature = $this->signatureContext($application, $sections, $generatedAt, $ipHash, $signatureCity, $signatureDate);
        $payroll = [
            ...$this->payrollContext($sections, $generatedAt, $signatureCity, $signatureDate),
            'signature' => $signature,
        ];

        $summaryPdf = $this->renderer->affiliationSummary($application, $sections, $signature);
        $payrollPdf = $this->renderer->payrollAuthorization($application, $sections, $payroll);

        return [
            'summary' => ($this->registerDocument)(
                application: $application,
                documentType: ApplicationDocumentType::AffiliationSummary,
                originalFilename: 'resumen-afiliacion.pdf',
                mimeType: 'application/pdf',
                byteSize: strlen($summaryPdf),
                actor: $actor,
                correlationId: $correlationId,
                ipHash: $ipHash,
                uploadedAt: $generatedAt,
                fileContents: $summaryPdf,
                auditAction: AffiliationAuditAction::DocumentGenerated->value,
            ),
            'payroll_authorization' => ($this->registerDocument)(
                application: $application,
                documentType: ApplicationDocumentType::PayrollAuthorization,
                originalFilename: 'autorizacion-descuento-nomina.pdf',
                mimeType: 'application/pdf',
                byteSize: strlen($payrollPdf),
                actor: $actor,
                correlationId: $correlationId,
                ipHash: $ipHash,
                uploadedAt: $generatedAt,
                fileContents: $payrollPdf,
                auditAction: AffiliationAuditAction::DocumentGenerated->value,
            ),
        ];
    }

    /**
     * @param  array<string, array<string, mixed>>  $sections
     * @return array<string, string>
     */
    private function signatureContext(
        AffiliationApplication $application,
        array $sections,
        Carbon $generatedAt,
        ?string $ipHash,
        ?string $signatureCity,
        ?string $signatureDate,
    ): array {
        $personal = $sections[AffiliationApplicationStep::Personal->value] ?? [];
        $signedAt = $this->signatureDate($signatureDate) ?? $generatedAt;
        $documentType = is_string($personal['documentType'] ?? null) ? trim($personal['documentType']) : '';
        $documentNumber = is_string($personal['documentNumber'] ?? null) ? trim($personal['documentNumber']) : '';
        $email = is_string($personal['email'] ?? null) ? trim($personal['email']) : '';
        $fullName = trim(implode(' ', array_filter([
            $personal['firstName'] ?? '',
            $personal['middleName'] ?? '',
            $personal['lastName'] ?? '',
            $personal['secondLastName'] ?? '',
        ])));
        $verificationHash = hash('sha256', implode('|', [
            $application->id,
            $fullName,
            $documentType,
            $documentNumber,
            $email,
            $signedAt->toIso8601String(),
            $ipHash ?? '',
        ]));

        return [
            'full_name' => $fullName,
            'document' => trim($documentType.' '.$documentNumber),
            'email' => $email,
            'city' => $signatureCity !== null && trim($signatureCity) !== '' ? trim($signatureCity) : 'Bucaramanga',
            'signed_at_label' => $signedAt->copy()->timezone('America/Bogota')->format('Y-m-d H:i:s'),
            'signature_date_label' => $this->spanishDate($signedAt),
            'ip_reference' => $ipHash ? substr($ipHash, 0, 16) : 'Registrada en auditoria',
            'verification_hash' => substr($verificationHash, 0, 16),
            'mechanism' => 'Aceptacion electronica del formulario',
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function decryptedSections(AffiliationApplication $application): array
    {
        $persistedSections = $application->sections()
            ->whereIn('section', array_map(
                fn (AffiliationApplicationStep $section): string => $section->value,
                AffiliationApplicationStep::formSections(),
            ))
            ->get()
            ->keyBy('section');

        $sections = [];

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $persisted = $persistedSections->get($section->value);
            $sections[$section->value] = $persisted
                ? $this->cipher->decryptArray($persisted->getAttribute('data_encrypted'))
                : [];
        }

        return $sections;
    }

    /**
     * @param  array<string, array<string, mixed>>  $sections
     * @return array<string, mixed>
     */
    private function payrollContext(array $sections, Carbon $generatedAt, ?string $signatureCity, ?string $signatureDate): array
    {
        $personal = $sections[AffiliationApplicationStep::Personal->value] ?? [];
        $employment = $sections[AffiliationApplicationStep::Employment->value] ?? [];
        $financial = $sections[AffiliationApplicationStep::Financial->value] ?? [];
        $salary = $this->numberValue($employment['monthlySalary'] ?? null);
        $mandatoryContribution = round($salary * 0.015, 2);
        $voluntaryApplies = $this->isYes($financial['voluntarySavings'] ?? null);
        $voluntaryValue = $voluntaryApplies ? $this->numberValue($financial['voluntarySavingsValue'] ?? null) : 0.0;

        $signedAt = $this->signatureDate($signatureDate) ?? $generatedAt;

        return [
            'city' => $signatureCity !== null && trim($signatureCity) !== '' ? trim($signatureCity) : 'Bucaramanga',
            'signature_date_label' => $this->spanishDate($signedAt),
            'full_name' => trim(implode(' ', array_filter([
                $personal['firstName'] ?? '',
                $personal['middleName'] ?? '',
                $personal['lastName'] ?? '',
                $personal['secondLastName'] ?? '',
            ]))),
            'document_number' => $personal['documentNumber'] ?? '',
            'issue_place' => $personal['issuePlace'] ?? '',
            'employer' => $employment['employer'] ?? '',
            'monthly_salary' => $salary,
            'mandatory_contribution' => $mandatoryContribution,
            'voluntary_savings_applies' => $voluntaryApplies,
            'voluntary_savings_value' => $voluntaryValue,
            'total_discount' => $mandatoryContribution + $voluntaryValue,
            'start_month' => '',
            'start_year' => '',
            'phone' => $personal['mobile'] ?? '',
            'email' => $personal['email'] ?? '',
        ];
    }

    private function signatureDate(?string $value): ?Carbon
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return Carbon::createFromFormat('Y-m-d', trim($value), 'America/Bogota')?->startOfDay();
    }

    private function spanishDate(Carbon $date): string
    {
        $months = [
            1 => 'enero',
            2 => 'febrero',
            3 => 'marzo',
            4 => 'abril',
            5 => 'mayo',
            6 => 'junio',
            7 => 'julio',
            8 => 'agosto',
            9 => 'septiembre',
            10 => 'octubre',
            11 => 'noviembre',
            12 => 'diciembre',
        ];

        return sprintf('%d de %s de %d', (int) $date->format('j'), $months[(int) $date->format('n')], (int) $date->format('Y'));
    }

    private function isYes(mixed $value): bool
    {
        return is_string($value) && strtolower(trim($value)) === 'si';
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
}
