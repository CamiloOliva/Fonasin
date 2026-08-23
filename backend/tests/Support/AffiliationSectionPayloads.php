<?php

namespace Tests\Support;

use App\Domain\Affiliation\Enums\AffiliationApplicationStep;

trait AffiliationSectionPayloads
{
    /**
     * @return array<string, mixed>
     */
    private function validSectionPayload(AffiliationApplicationStep $section): array
    {
        return match ($section) {
            AffiliationApplicationStep::Personal => [
                'documentType' => 'CC',
                'documentNumber' => '123456789',
                'issueDate' => '2020-01-15',
                'issuePlace' => 'Bogota',
                'firstName' => 'Persona',
                'middleName' => '',
                'lastName' => 'Sintetica',
                'secondLastName' => '',
                'birthDate' => '1990-05-20',
                'nationality' => 'Colombiana',
                'residenceCountry' => 'Colombia',
                'maritalStatus' => 'Soltero',
                'residenceAddress' => 'Calle 123 # 45-67',
                'city' => 'Bogota',
                'department' => 'Cundinamarca',
                'neighborhood' => 'Centro',
                'mobile' => '3001234567',
                'email' => 'persona.sintetica@example.test',
                'educationLevel' => 'Profesional',
                'profession' => 'Ingenieria',
                'hasDependents' => 'No',
                'dependentsCount' => '',
            ],
            AffiliationApplicationStep::Employment => [
                'employer' => 'Empresa Sintetica S.A.S.',
                'position' => 'Analista',
                'departmentArea' => 'Operaciones',
                'contractType' => 'Indefinido',
                'hireDate' => '2022-03-01',
                'workCity' => 'Bogota',
                'monthlySalary' => '2500000',
            ],
            AffiliationApplicationStep::Financial => [
                'principalIncome' => '2500000',
                'otherIncome' => '0',
                'totalIncome' => '2500000',
                'monthlyExpenses' => '1200000',
                'financialObligations' => '300000',
                'totalExpenses' => '1500000',
                'assetsValue' => '15000000',
                'liabilitiesValue' => '5000000',
                'equityValue' => '10000000',
                'incomeBand' => '2 a 4 SMMLV',
                'voluntarySavings' => 'Si',
                'voluntarySavingsValue' => '100000',
            ],
            AffiliationApplicationStep::Beneficiaries => [
                'beneficiaries' => [[
                    'documentType' => 'CC',
                    'documentNumber' => '987654321',
                    'fullName' => 'Beneficiario Sintetico',
                    'relationship' => 'Hermano',
                    'birthDate' => '1995-08-10',
                    'phone' => '3011234567',
                    'percentage' => '100',
                ]],
                'emergencyContact' => [
                    'fullName' => 'Contacto Sintetico',
                    'relationship' => 'Padre',
                    'phone' => '3021234567',
                ],
            ],
            AffiliationApplicationStep::Sarlaft => [
                'economicActivity' => 'Empleado',
                'incomeSource' => ['Salario'],
                'resourceOrigin' => ['Actividad laboral'],
                'pep' => 'No',
                'pepType' => '',
                'pepPosition' => '',
                'pepEntity' => '',
                'pepLinkDate' => '',
                'pepUnlinkDate' => '',
                'relatedPepName' => '',
                'relatedPepRelation' => '',
                'foreignAccounts' => 'No',
                'foreignAccountCountry' => '',
                'foreignAccountEntity' => '',
                'foreignAccountType' => '',
                'foreignAccountOrigin' => '',
                'actsOnBehalfOfThirdParties' => 'No',
                'thirdPartyName' => '',
                'thirdPartyId' => '',
                'thirdPartyRelation' => '',
                'thirdPartyOrigin' => '',
                'taxResidenceCountry' => 'Colombia',
                'hasForeignTaxObligations' => 'No',
                'foreignTaxId' => '',
                'expectedOperations' => ['Aportes'],
            ],
            default => ['section' => $section->value],
        };
    }
}
