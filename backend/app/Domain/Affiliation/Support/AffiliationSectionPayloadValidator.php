<?php

namespace App\Domain\Affiliation\Support;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use DateTimeImmutable;

class AffiliationSectionPayloadValidator
{
    private const ALLOWED_DOCUMENT_TYPES = ['CC', 'CE', 'Pasaporte', 'TI'];
    private const MIN_MONTHLY_SALARY = 1750905;
    private const MAX_MONEY_VALUE = 100000000;

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
            'educationLevel',
            'profession',
            'hasDependents',
        ]);

        if (! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw CannotSaveApplicationSection::invalidField($section->value, 'email', 'debe ser un correo electronico valido');
        }

        $this->requireDocumentNumber($section, $data, 'documentNumber');
        $this->requireDocumentType($section, $data, 'documentType');
        $this->requirePhone($section, $data, 'mobile');
        $this->requirePastOrTodayDate($section, $data, 'issueDate');
        $this->requirePastOrTodayDate($section, $data, 'birthDate');
        $this->requireMaxLengths($section, $data, [
            'documentType' => 20,
            'documentNumber' => 30,
            'issuePlace' => 120,
            'firstName' => 80,
            'middleName' => 80,
            'lastName' => 80,
            'secondLastName' => 80,
            'nationality' => 80,
            'residenceCountry' => 80,
            'maritalStatus' => 60,
            'residenceAddress' => 180,
            'city' => 120,
            'department' => 120,
            'neighborhood' => 120,
            'mobile' => 30,
            'email' => 254,
            'educationLevel' => 80,
            'profession' => 120,
            'hasDependents' => 10,
            'dependentsCount' => 3,
        ]);
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

        $this->requireMoneyRange($section, $data, 'monthlySalary', self::MIN_MONTHLY_SALARY, self::MAX_MONEY_VALUE);
        $this->requirePastOrTodayDate($section, $data, 'hireDate');
        $this->requireOtherDetail($section, $data, 'contractType', 'Otro', 'contractTypeOther');
        $this->requireMaxLengths($section, $data, [
            'employer' => 160,
            'position' => 120,
            'departmentArea' => 120,
            'contractType' => 80,
            'contractTypeOther' => 80,
            'workCity' => 120,
            'monthlySalary' => 20,
        ]);
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
            $this->requireMoneyLimit($section, $data, $field);
        }

        if ($this->isYes($data['voluntarySavings']) && $this->isBlank($data['voluntarySavingsValue'] ?? null)) {
            throw CannotSaveApplicationSection::missingRequiredFields($section->value, ['voluntarySavingsValue']);
        }

        if (! $this->isBlank($data['voluntarySavingsValue'] ?? null)) {
            $this->requireNonNegativeNumber($section, $data, 'voluntarySavingsValue');
            $this->requireMoneyLimit($section, $data, 'voluntarySavingsValue');
        }

        $this->requireMaxLengths($section, $data, [
            'principalIncome' => 20,
            'otherIncome' => 20,
            'totalIncome' => 20,
            'monthlyExpenses' => 20,
            'financialObligations' => 20,
            'totalExpenses' => 20,
            'assetsValue' => 20,
            'liabilitiesValue' => 20,
            'equityValue' => 20,
            'incomeBand' => 80,
            'voluntarySavings' => 10,
            'voluntarySavingsValue' => 20,
        ]);
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

        if (count($data['beneficiaries']) > 5) {
            throw CannotSaveApplicationSection::invalidField($section->value, 'beneficiaries', 'no puede contener mas de cinco beneficiarios');
        }

        foreach ($data['beneficiaries'] as $index => $beneficiary) {
            if (! is_array($beneficiary)) {
                throw CannotSaveApplicationSection::invalidField($section->value, "beneficiaries.{$index}", 'debe ser un objeto');
            }

            $this->requireFields($section, $beneficiary, [
                'documentType',
                'documentNumber',
                'fullName',
                'relationship',
                'birthDate',
                'phone',
            ], "beneficiaries.{$index}.");

            $this->requireDocumentNumber($section, $beneficiary, 'documentNumber', "beneficiaries.{$index}.documentNumber");
            $this->requireDocumentType($section, $beneficiary, 'documentType', "beneficiaries.{$index}.documentType");
            $this->requirePhone($section, $beneficiary, 'phone', "beneficiaries.{$index}.phone");
            $this->requirePastOrTodayDate($section, $beneficiary, 'birthDate', "beneficiaries.{$index}.birthDate");
            $this->requireOtherDetail($section, $beneficiary, 'relationship', 'Otro', 'relationshipOther', "beneficiaries.{$index}.");
            $this->requireMaxLengths($section, $beneficiary, [
                'documentType' => 20,
                'documentNumber' => 30,
                'fullName' => 160,
                'relationship' => 80,
                'relationshipOther' => 80,
                'phone' => 30,
            ], "beneficiaries.{$index}.");
        }

        if (! is_array($data['emergencyContact'])) {
            throw CannotSaveApplicationSection::invalidField($section->value, 'emergencyContact', 'debe ser un objeto');
        }

        $this->requireFields($section, $data['emergencyContact'], [
            'fullName',
            'relationship',
            'phone',
        ], 'emergencyContact.');

        $this->requirePhone($section, $data['emergencyContact'], 'phone', 'emergencyContact.phone');
        $this->requireMaxLengths($section, $data['emergencyContact'], [
            'fullName' => 160,
            'relationship' => 80,
            'phone' => 30,
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

            if (count($data[$field]) > 10) {
                throw CannotSaveApplicationSection::invalidField($section->value, $field, 'no puede contener mas de diez valores');
            }
        }

        $this->requireOtherDetail($section, $data, 'incomeSource', 'Otro', 'incomeSourceOther');
        $this->requireOtherDetail($section, $data, 'resourceOrigin', 'Otro', 'resourceOriginOther');
        $this->requireOtherDetail($section, $data, 'expectedOperations', 'Otros servicios', 'expectedOperationsOther');

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
            $this->requireOtherDetail($section, $data, 'foreignAccountType', 'Otra', 'foreignAccountTypeOther');
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

        $this->requireMaxLengths($section, $data, [
            'economicActivity' => 160,
            'incomeSourceOther' => 80,
            'resourceOriginOther' => 80,
            'pep' => 10,
            'pepType' => 120,
            'pepPosition' => 160,
            'pepEntity' => 160,
            'relatedPepName' => 160,
            'relatedPepRelation' => 80,
            'foreignAccounts' => 10,
            'foreignAccountCountry' => 80,
            'foreignAccountEntity' => 160,
            'foreignAccountType' => 80,
            'foreignAccountTypeOther' => 80,
            'foreignAccountOrigin' => 160,
            'actsOnBehalfOfThirdParties' => 10,
            'thirdPartyName' => 160,
            'thirdPartyId' => 40,
            'thirdPartyRelation' => 80,
            'thirdPartyOrigin' => 160,
            'taxResidenceCountry' => 80,
            'hasForeignTaxObligations' => 10,
            'foreignTaxId' => 80,
            'expectedOperationsOther' => 80,
        ]);

        foreach (['pepLinkDate', 'pepUnlinkDate'] as $field) {
            if (! $this->isBlank($data[$field] ?? null)) {
                $this->requirePastOrTodayDate($section, $data, $field);
            }
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
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'debe ser mayor que cero');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireNonNegativeNumber(AffiliationApplicationStep $section, array $data, string $field): void
    {
        $value = $this->numberValue($data[$field] ?? null);

        if ($value === null || $value < 0) {
            throw CannotSaveApplicationSection::invalidField($section->value, $field, 'debe ser mayor o igual a cero');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireMoneyLimit(AffiliationApplicationStep $section, array $data, string $field): void
    {
        $value = $this->numberValue($data[$field] ?? null);

        if ($value === null || $value > self::MAX_MONEY_VALUE) {
            throw CannotSaveApplicationSection::invalidField($section->value, $field, 'supera el limite de monto permitido');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireMoneyRange(AffiliationApplicationStep $section, array $data, string $field, int $minimum, int $maximum): void
    {
        $value = $this->numberValue($data[$field] ?? null);

        if ($value === null || $value < $minimum || $value > $maximum) {
            throw CannotSaveApplicationSection::invalidField(
                $section->value,
                $field,
                'debe estar entre $'.number_format($minimum, 0, ',', '.').' y $'.number_format($maximum, 0, ',', '.'),
            );
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, int>  $limits
     */
    private function requireMaxLengths(AffiliationApplicationStep $section, array $data, array $limits, string $prefix = ''): void
    {
        foreach ($limits as $field => $limit) {
            if (! array_key_exists($field, $data) || $this->isBlank($data[$field])) {
                continue;
            }

            if (! is_string($data[$field])) {
                continue;
            }

            if (mb_strlen(trim($data[$field])) > $limit) {
                throw CannotSaveApplicationSection::invalidField(
                    $section->value,
                    $prefix.$field,
                    "no puede tener mas de {$limit} caracteres",
                );
            }
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireOtherDetail(
        AffiliationApplicationStep $section,
        array $data,
        string $triggerField,
        string $triggerValue,
        string $detailField,
        string $prefix = '',
    ): void {
        $trigger = $data[$triggerField] ?? null;
        $isSelected = is_array($trigger)
            ? in_array($triggerValue, $trigger, true)
            : is_string($trigger) && trim($trigger) === $triggerValue;

        if (! $isSelected) {
            return;
        }

        $detail = $data[$detailField] ?? null;
        if ($this->isBlank($detail)) {
            throw CannotSaveApplicationSection::missingRequiredFields($section->value, [$prefix.$detailField]);
        }

        if (! is_string($detail) || mb_strlen(trim($detail)) < 3 || ! preg_match('/[\pL\pN]/u', $detail)) {
            throw CannotSaveApplicationSection::invalidField($section->value, $prefix.$detailField, 'debe especificar al menos 3 caracteres validos');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireDocumentType(
        AffiliationApplicationStep $section,
        array $data,
        string $field,
        ?string $displayField = null,
    ): void {
        $value = $data[$field] ?? null;

        if (! is_string($value) || ! in_array(trim($value), self::ALLOWED_DOCUMENT_TYPES, true)) {
            throw CannotSaveApplicationSection::invalidField(
                $section->value,
                $displayField ?? $field,
                'debe ser CC, CE, Pasaporte o TI',
            );
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requireDocumentNumber(
        AffiliationApplicationStep $section,
        array $data,
        string $field,
        ?string $displayField = null,
    ): void {
        $value = $data[$field] ?? null;

        if (! is_string($value) || ! preg_match('/^[A-Za-z0-9.-]{5,30}$/', trim($value))) {
            throw CannotSaveApplicationSection::invalidField(
                $section->value,
                $displayField ?? $field,
                'debe contener entre 5 y 30 letras, numeros, puntos o guiones',
            );
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requirePhone(
        AffiliationApplicationStep $section,
        array $data,
        string $field,
        ?string $displayField = null,
    ): void {
        $value = $data[$field] ?? null;

        if (! is_string($value)) {
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'debe ser un telefono valido');
        }

        $digits = preg_replace('/\D/', '', $value) ?? '';

        if (! preg_match('/^3\d{9}$/', $digits)) {
            throw CannotSaveApplicationSection::invalidField(
                $section->value,
                $displayField ?? $field,
                'debe contener 10 digitos e iniciar por 3',
            );
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function requirePastOrTodayDate(
        AffiliationApplicationStep $section,
        array $data,
        string $field,
        ?string $displayField = null,
    ): void {
        $value = $data[$field] ?? null;

        if (! is_string($value)) {
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'debe ser una fecha valida');
        }

        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        if (! $date || $date->format('Y-m-d') !== $value) {
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'debe usar el formato AAAA-MM-DD');
        }

        $today = new DateTimeImmutable('today');

        if ($date > $today) {
            throw CannotSaveApplicationSection::invalidField($section->value, $displayField ?? $field, 'no puede estar en el futuro');
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
