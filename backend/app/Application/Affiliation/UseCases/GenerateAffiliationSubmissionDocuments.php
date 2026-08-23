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
    ): array {
        $sections = $this->decryptedSections($application);
        $payroll = $this->payrollContext($sections);
        $generatedAt ??= now();

        $summaryPdf = $this->renderer->affiliationSummary($application, $sections);
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
    private function payrollContext(array $sections): array
    {
        $personal = $sections[AffiliationApplicationStep::Personal->value] ?? [];
        $employment = $sections[AffiliationApplicationStep::Employment->value] ?? [];
        $financial = $sections[AffiliationApplicationStep::Financial->value] ?? [];
        $salary = $this->numberValue($employment['monthlySalary'] ?? null);
        $mandatoryContribution = round($salary * 0.015, 2);
        $voluntaryApplies = $this->isYes($financial['voluntarySavings'] ?? null);
        $voluntaryValue = $voluntaryApplies ? $this->numberValue($financial['voluntarySavingsValue'] ?? null) : 0.0;

        return [
            'city' => 'Bucaramanga',
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
