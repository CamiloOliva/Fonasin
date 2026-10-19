<?php

namespace App\Infrastructure\Portal;

use App\Application\Portal\Contracts\ExportsAssociateProfiles;
use Shuchkin\SimpleXLSXGen;

class SimpleXlsxAssociateProfileExporter implements ExportsAssociateProfiles
{
    private const LABELS = [
        'id' => 'Identificador', 'document_type' => 'Tipo de documento', 'document_number' => 'Numero de documento',
        'full_name' => 'Nombre completo', 'status' => 'Estado', 'email' => 'Correo electronico', 'user_status' => 'Estado de acceso',
        'personal' => 'Datos personales', 'employment' => 'Informacion laboral', 'financial' => 'Informacion economica',
        'beneficiaries' => 'Beneficiarios', 'sarlaft' => 'SARLAFT', 'emergencyContact' => 'Contacto de emergencia',
        'documentType' => 'Tipo de documento', 'documentNumber' => 'Numero de documento', 'issueDate' => 'Fecha de expedicion',
        'issuePlace' => 'Lugar de expedicion', 'firstName' => 'Primer nombre', 'middleName' => 'Segundo nombre',
        'lastName' => 'Primer apellido', 'secondLastName' => 'Segundo apellido', 'birthDate' => 'Fecha de nacimiento',
        'neighborhood' => 'Barrio', 'relationshipOther' => 'Otro parentesco',
        'nationality' => 'Nacionalidad', 'residenceCountry' => 'Pais de residencia', 'maritalStatus' => 'Estado civil',
        'residenceAddress' => 'Direccion de residencia', 'city' => 'Ciudad', 'department' => 'Departamento',
        'mobile' => 'Celular', 'phone' => 'Telefono', 'educationLevel' => 'Nivel educativo', 'profession' => 'Profesion',
        'hasDependents' => 'Tiene personas a cargo', 'dependentsCount' => 'Personas a cargo',
        'employer' => 'Empresa', 'position' => 'Cargo', 'departmentArea' => 'Area o dependencia',
        'contractType' => 'Tipo de contrato', 'contractTypeOther' => 'Otro tipo de contrato', 'hireDate' => 'Fecha de ingreso',
        'workCity' => 'Ciudad de trabajo', 'monthlySalary' => 'Salario mensual', 'principalIncome' => 'Ingreso mensual principal',
        'otherIncome' => 'Otros ingresos mensuales', 'totalIncome' => 'Total ingresos mensuales',
        'monthlyExpenses' => 'Gastos mensuales', 'financialObligations' => 'Obligaciones financieras',
        'totalExpenses' => 'Total egresos mensuales', 'assetsValue' => 'Activos', 'liabilitiesValue' => 'Pasivos',
        'equityValue' => 'Patrimonio', 'incomeBand' => 'Rango de ingresos', 'voluntarySavings' => 'Desea ahorro voluntario',
        'voluntarySavingsValue' => 'Valor mensual de ahorro voluntario', 'fullName' => 'Nombre completo',
        'relationship' => 'Parentesco', 'percentage' => 'Porcentaje', 'economicActivity' => 'Actividad economica',
        'economicActivityOther' => 'Otra actividad economica', 'incomeSource' => 'Fuente de ingresos',
        'incomeSourceOther' => 'Otra fuente de ingresos', 'resourceOrigin' => 'Origen de recursos',
        'resourceOriginOther' => 'Otro origen de recursos', 'expectedOperations' => 'Operaciones esperadas',
        'expectedOperationsOther' => 'Otras operaciones esperadas', 'handlesPublicResources' => 'Maneja recursos publicos',
        'publicResourcesDetail' => 'Detalle de recursos publicos', 'isPep' => 'Persona expuesta politicamente',
        'pepDetail' => 'Detalle de exposicion politica', 'hasForeignAccounts' => 'Tiene cuentas en el exterior',
        'foreignAccountsDetail' => 'Detalle de cuentas en el exterior', 'hasForeignTransactions' => 'Realiza operaciones internacionales',
        'foreignTransactionsDetail' => 'Detalle de operaciones internacionales',
        'pep' => 'Persona expuesta politicamente', 'pepType' => 'Tipo de exposicion politica',
        'pepPosition' => 'Cargo de exposicion politica', 'pepEntity' => 'Entidad de exposicion politica',
        'pepLinkDate' => 'Fecha de vinculacion politica', 'pepUnlinkDate' => 'Fecha de desvinculacion politica',
        'relatedPepName' => 'Nombre de persona expuesta politicamente relacionada', 'relatedPepRelation' => 'Relacion con persona expuesta politicamente',
        'foreignAccounts' => 'Tiene cuentas en el exterior', 'foreignAccountCountry' => 'Pais de cuenta en el exterior',
        'foreignAccountEntity' => 'Entidad de cuenta en el exterior', 'foreignAccountType' => 'Tipo de cuenta en el exterior',
        'foreignAccountTypeOther' => 'Otro tipo de cuenta en el exterior', 'foreignAccountOrigin' => 'Origen de fondos en el exterior',
        'actsOnBehalfOfThirdParties' => 'Actua por cuenta de terceros', 'thirdPartyName' => 'Nombre del tercero',
        'thirdPartyId' => 'Documento del tercero', 'thirdPartyRelation' => 'Relacion con el tercero',
        'thirdPartyOrigin' => 'Origen de recursos del tercero', 'taxResidenceCountry' => 'Pais de residencia fiscal',
        'hasForeignTaxObligations' => 'Tiene obligaciones tributarias en el exterior', 'foreignTaxId' => 'Identificacion tributaria extranjera',
        'credit_line' => 'Linea de credito', 'promissory_note_number' => 'Numero de pagare',
        'initial_balance' => 'Saldo inicial', 'current_balance' => 'Saldo actual', 'installment_amount' => 'Valor de cuota',
        'last_payment_date' => 'Fecha del ultimo pago', 'term_months' => 'Plazo en meses',
        'interest_rate' => 'Tasa de interes mensual (%)', 'interest_rate_nominal_annual' => 'Tasa de interes nominal anual (%)',
        'contribution_balance' => 'Saldo de aportes', 'permanent_savings_balance' => 'Saldo de ahorro permanente',
        'voluntary_savings_balance' => 'Saldo de ahorro voluntario', 'total_balance' => 'Saldo total',
        'last_period' => 'Ultimo periodo', 'last_cut_off_date' => 'Ultima fecha de corte',
        'movement_type' => 'Tipo de movimiento', 'period' => 'Periodo', 'cut_off_date' => 'Fecha de corte',
        'amount' => 'Valor mensual', 'balance_after' => 'Saldo a la fecha de corte', 'reference' => 'Referencia',
    ];

    private const MONEY_FIELDS = [
        'monthlySalary', 'principalIncome', 'otherIncome', 'totalIncome', 'monthlyExpenses', 'financialObligations',
        'totalExpenses', 'assetsValue', 'liabilitiesValue', 'equityValue', 'voluntarySavingsValue',
        'initial_balance', 'current_balance', 'installment_amount', 'contribution_balance', 'permanent_savings_balance',
        'voluntary_savings_balance', 'total_balance', 'amount', 'balance_after',
    ];

    private const TEXT_FIELDS = ['id', 'documentNumber', 'document_number', 'phone', 'mobile', 'promissory_note_number', 'reference', 'thirdPartyId', 'foreignTaxId'];

    public function spreadsheet(array $profile): string
    {
        $rows = [
            ['FONASIN - Ficha consolidada del asociado', '', ''],
            ['Categoria', 'Campo', 'Valor'],
        ];

        $this->append($rows, 'Identificacion', $profile['associate'] ?? []);

        $application = $profile['form']['application'] ?? null;
        if (is_array($application)) {
            foreach ($application['sections'] ?? [] as $section) {
                if (is_array($section)) {
                    $sectionName = $section['section'] ?? 'seccion';
                    $this->append($rows, 'Formulario / '.(self::LABELS[$sectionName] ?? $sectionName), $section['data'] ?? []);
                }
            }
        }

        foreach ($profile['credits']['items'] ?? [] as $index => $credit) {
            $this->append($rows, 'Cartera '.((int) $index + 1), is_array($credit) ? $credit : []);
        }

        if (is_array($profile['contributions']['account'] ?? null)) {
            $this->append($rows, 'Aportes y ahorros', $profile['contributions']['account']);
        }

        foreach ($profile['contributions']['movements'] ?? [] as $index => $movement) {
            $this->append($rows, 'Movimiento '.((int) $index + 1), is_array($movement) ? $movement : []);
        }

        return (string) SimpleXLSXGen::fromArray($rows);
    }

    /**
     * @param  list<array<int, string|int|float>>  $rows
     * @param  array<string, mixed>  $values
     */
    private function append(array &$rows, string $category, array $values, string $prefix = ''): void
    {
        foreach ($values as $key => $value) {
            $label = is_int($key) ? (string) ($key + 1) : (self::LABELS[$key] ?? $key);
            $field = $prefix === '' ? (string) $label : $prefix.' / '.$label;

            if (is_array($value)) {
                $this->append($rows, $category, $value, $field);

                continue;
            }

            $rows[] = [$this->safeCell($category), $this->safeCell($field), $this->fieldValue((string) $key, $value)];
        }
    }

    private function fieldValue(string $field, mixed $value): string|int|float
    {
        if (in_array($field, self::TEXT_FIELDS, true) && (is_string($value) || is_numeric($value))) {
            return $this->safeCell((string) $value);
        }
        // Convert only known monetary fields. Numeric-looking IDs must remain text.
        if (in_array($field, self::MONEY_FIELDS, true) && is_string($value)
            && preg_match('/^-?\d+(?:\.\d{1,2})?$/D', $value) === 1
            && is_finite((float) $value) && abs((float) $value) <= 999999999999.99) {
            return (float) $value;
        }

        return $this->safeCell($value);
    }

    private function safeCell(mixed $value): string|int|float
    {
        if (is_bool($value)) {
            return $value ? 'Si' : 'No';
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        $text = $value === null ? '' : (string) $value;

        $text = preg_match('/^[=+\-@]/', ltrim($text)) === 1 ? "'".$text : $text;

        // SimpleXLSXGen's raw-string prefix bypasses formulas, HTML-like
        // formatting and hyperlink detection. It is removed by the writer.
        return "\0".$text;
    }
}
