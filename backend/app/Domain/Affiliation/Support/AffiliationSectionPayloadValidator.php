<?php

namespace App\Domain\Affiliation\Support;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;

class AffiliationSectionPayloadValidator
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function validateCompleted(AffiliationApplicationStep $section, array $data): void
    {
        match ($section) {
            AffiliationApplicationStep::Personal => $this->validatePersonal($section, $data),
            AffiliationApplicationStep::Employment => $this->validateEmployment($section, $data),
            AffiliationApplicationStep::Financial => $this->validateFinancial($section, $data),
            AffiliationApplicationStep::Beneficiaries => $this->validateBeneficiaries($section, $data),
            AffiliationApplicationStep::Sarlaft => $this->validateSarlaft($section, $data),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validatePersonal(AffiliationApplicationStep $section, array $data): void
    {
        $this->requireFields($section, $data, [
            'documentType',
            'documentNumber',
            'issueDate',
            'issuePlace',
            'firstName',
            'lastName',
            'birthDate',
            'nationality',
            'residenceCountry',
            'maritalStatus',
            'residenceAddress',
            'city',
            'department',
            'mobile',
            'email',
        ]);

        if (! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw CannotSaveApplicationSection::invalidField($section->value, 'email', 'it must be a valid email address');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateEmployment(AffiliationApplicationStep $section, array $data): void
    {
        $this->requireFields($section, $data, [
            'employer',
            'position',
            'departmentArea',
            'contractType',
            'hireDate',
            'workCity',
            'monthlySalary',
        ]);

        $this->requirePositiveNumber($section, $data, 'monthlySalary');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateFinancial(AffiliationApplicationStep $section, array $data): void
    {
        $this->requireFields($section, $data, [
            'principalIncome',
            'totalIncome',
            'monthlyExpenses',
            'totalExpenses',
            'assetsValue',
            'liabilitiesValue',
            'equityValue',
            'incomeBand',
            'voluntarySavings',
        ]);

        foreach ([
            'principalIncome',
            'totalIncome',
            'monthlyExpenses',
            'totalExpenses',
            'assetsValue',
            'liabilitiesValue',
            'equityValue',
        ] as $field) {
            $this->requireNonNegativeNumber($section, $data, $field);
        }

        if ($this->isYes($data['voluntarySavings']) && $this->isBlank($data['voluntarySavingsValue'] ?? null)) {
            throw CannotSaveApplicationSection::missingRequiredFields($section->value, ['voluntarySavingsValue']);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateBeneficiaries(AffiliationApplicationStep $section, array $data): void
    {
        $this->requireFields($section, $data, ['beneficiaries', 'emergencyContact']);

        if (! is_array($data['beneficiaries']) || $data['beneficiaries'] === []) {
            throw CannotSaveApplicationSection::missingRequiredFields($section->value, ['beneficiaries']);
        }

        foreach ($data['beneficiaries'] as $index => $beneficiary) {
            if (! is_array($beneficiary)) {
                throw CannotSaveApplicationSection::invalidField($section->value, "beneficiaries.{$index}", 'it must be an object');
            }

            $this->requireFields($section, $beneficiary, [
                'documentType',
                'documentNumber',
                'fullName',
                'relationship',
                'birthDate',
                'phone',
                'percentage',
            ], "beneficiaries.{$index}.");

            $this->requirePositiveNumber($section, $beneficiary, 'percentage', "beneficiaries.{$index}.percentage");
        }

        if (! is_array($data['emergencyContact'])) {
            throw CannotSaveApplicationSection::invalidField($section->value, 'emergencyContact', 'it must be an object');
        }

        $this->requireFields($section, $data['emergencyContact'], [
            'fullName',
            'relationship',
            'phone',
        ], 'emergencyContact.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateSarlaft(AffiliationApplicationStep $section, array $data): void
    {
        $this->requireFields($section, $data, [
            'economicActivity',
            'incomeSource',
            'resourceOrigin',
            'pep',
            'foreignAccounts',
            'actsOnBehalfOfThirdParties',
            'taxResidenceCountry',
            'hasForeignTaxObligations',
            'expectedOperations',
        ]);

        foreach (['incomeSource', 'resourceOrigin', 'expectedOperations'] as $field) {
            if (! is_array($data[$field]) || $data[$field] === []) {
                throw CannotSaveApplicationSection::missingRequiredFields($section->value, [$field]);
            }
        }

        if ($this->isYes($data['pep'])) {
            $this->requireFields($section, $data, ['pepType', 'pepPosition', 'pepEntity', 'pepLinkDate']);
        }

        if ($this->isYes($data['foreignAccounts'])) {
            $this->requireFields($section, $data, [
                'foreignAccountCountry',
                'foreignAccountEntity',
                'foreignAccountType',
                'foreignAccountOrigin',
            ]);
        }

        if ($this->isYes($data['actsOnBehalfOfThirdParties'])) {
            $this->requireFields($section, $data, [
                'thirdPartyName',
                'thirdPartyId',
                'thirdPartyRelation',
                'thirdPartyOrigin',
            ]);
        }

        if ($this->isYes($data['hasForeignTaxObligations'])) {
            $this->requireFields($section, $data, ['foreignTaxId']);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<string>  $fields
     */
    private function requireFields(AffiliationApplicationStep $section, array $data, array $fields, string $prefix = ''): void
    {
        $missing = [];

        foreach ($fields as $field) {
            if (! array_key_exists($field, $data) || $this->isBlank($data[$field])) {
                $missing[] = $prefix.$field;
            }
        }

        if ($missing !== []) {
            throw CannotSaveApplicationSection::missingRequiredFields($section->value, $missing);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requirePositiveNumber(
        AffiliationApplicationStep $section,
        array $data,
        string $field,
        ?string $displayField = null,
    ): void {
        $value = $this->numberValue($data[$field] ?? null);

        if ($value === null || $value <= 0) {
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'it must be greater than zero');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireNonNegativeNumber(AffiliationApplicationStep $section, array $data, string $field): void
    {
        $value = $this->numberValue($data[$field] ?? null);

        if ($value === null || $value < 0) {
            throw CannotSaveApplicationSection::invalidField($section->value, $field, 'it must be zero or greater');
        }
    }

    private function isBlank(mixed $value): bool
    {
        return $value === null
            || (is_string($value) && trim($value) === '')
            || (is_array($value) && $value === []);
    }

    private function isYes(mixed $value): bool
    {
        return is_string($value) && strtolower(trim($value)) === 'si';
    }

    private function numberValue(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $normalized = preg_replace('/[^\d.-]/', '', $value);

        if ($normalized === null || $normalized === '' || ! is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }
}
