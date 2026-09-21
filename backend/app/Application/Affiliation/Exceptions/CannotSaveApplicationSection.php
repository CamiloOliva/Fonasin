<?php

namespace App\Application\Affiliation\Exceptions;

use DomainException;

class CannotSaveApplicationSection extends DomainException
{
    public static function unsupportedSection(string $section): self
    {
        return new self("La seccion [{$section}] no se guarda como una seccion del formulario de afiliacion.");
    }

    /**
     * @param  list<string>  $fields
     */
    public static function missingRequiredFields(string $section, array $fields): self
    {
        $labels = array_map(self::fieldLabel(...), $fields);

        return new self(sprintf(
            'La seccion [%s] no se puede completar porque faltan campos obligatorios: %s.',
            $section,
            implode(', ', $labels),
        ));
    }

    public static function invalidField(string $section, string $field, string $reason): self
    {
        return new self("La seccion [{$section}] tiene un campo invalido [".self::fieldLabel($field)."]: {$reason}.");
    }

    private static function fieldLabel(string $field): string
    {
        $labels = [
            'documentType' => 'tipo de documento',
            'documentNumber' => 'numero de documento',
            'issueDate' => 'fecha de expedicion',
            'issuePlace' => 'lugar de expedicion',
            'firstName' => 'primer nombre',
            'middleName' => 'segundo nombre',
            'lastName' => 'primer apellido',
            'secondLastName' => 'segundo apellido',
            'birthDate' => 'fecha de nacimiento',
            'nationality' => 'nacionalidad',
            'residenceCountry' => 'pais de residencia',
            'maritalStatus' => 'estado civil',
            'residenceAddress' => 'direccion de residencia',
            'city' => 'ciudad',
            'department' => 'departamento',
            'neighborhood' => 'barrio',
            'mobile' => 'celular',
            'email' => 'correo electronico',
            'educationLevel' => 'nivel educativo',
            'profession' => 'profesion',
            'hasDependents' => 'personas a cargo',
            'dependentsCount' => 'numero de personas a cargo',
            'employer' => 'empresa donde labora',
            'position' => 'cargo',
            'departmentArea' => 'area o dependencia',
            'contractType' => 'tipo de contrato',
            'hireDate' => 'fecha de ingreso',
            'workCity' => 'ciudad de trabajo',
            'monthlySalary' => 'salario mensual',
            'principalIncome' => 'ingreso principal',
            'otherIncome' => 'otros ingresos',
            'totalIncome' => 'total de ingresos',
            'monthlyExpenses' => 'gastos mensuales',
            'financialObligations' => 'obligaciones financieras',
            'totalExpenses' => 'total de egresos',
            'assetsValue' => 'valor de activos',
            'liabilitiesValue' => 'valor de pasivos',
            'equityValue' => 'patrimonio',
            'incomeBand' => 'rango de ingresos',
            'voluntarySavings' => 'ahorro voluntario',
            'voluntarySavingsValue' => 'valor de ahorro voluntario',
            'beneficiaries' => 'beneficiarios',
            'beneficiaries.percentage' => 'porcentaje total de beneficiarios',
            'emergencyContact' => 'contacto de emergencia',
            'fullName' => 'nombre completo',
            'relationship' => 'parentesco',
            'phone' => 'telefono',
            'percentage' => 'porcentaje',
            'economicActivity' => 'actividad economica',
            'incomeSource' => 'fuente de ingresos',
            'resourceOrigin' => 'origen de recursos',
            'pep' => 'declaracion PEP',
            'pepType' => 'tipo PEP',
            'pepPosition' => 'cargo PEP',
            'pepEntity' => 'entidad PEP',
            'pepLinkDate' => 'fecha de vinculacion PEP',
            'pepUnlinkDate' => 'fecha de desvinculacion PEP',
            'relatedPepName' => 'nombre de PEP relacionado',
            'relatedPepRelation' => 'relacion con PEP',
            'foreignAccounts' => 'cuentas en el exterior',
            'foreignAccountCountry' => 'pais de cuenta en el exterior',
            'foreignAccountEntity' => 'entidad de cuenta en el exterior',
            'foreignAccountType' => 'tipo de cuenta en el exterior',
            'foreignAccountOrigin' => 'origen de cuenta en el exterior',
            'actsOnBehalfOfThirdParties' => 'actua por cuenta de terceros',
            'thirdPartyName' => 'nombre del tercero',
            'thirdPartyId' => 'identificacion del tercero',
            'thirdPartyRelation' => 'relacion con el tercero',
            'thirdPartyOrigin' => 'origen de recursos del tercero',
            'taxResidenceCountry' => 'pais de residencia fiscal',
            'hasForeignTaxObligations' => 'obligaciones tributarias en el exterior',
            'foreignTaxId' => 'identificacion tributaria en el exterior',
            'expectedOperations' => 'operaciones esperadas',
        ];

        if (isset($labels[$field])) {
            return $labels[$field];
        }

        $normalized = preg_replace('/^beneficiaries\.\d+\./', '', $field);

        return $normalized && isset($labels[$normalized]) ? $labels[$normalized] : $field;
    }
}
