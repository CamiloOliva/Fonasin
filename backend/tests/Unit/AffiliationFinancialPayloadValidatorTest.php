<?php

namespace Tests\Unit;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Support\AffiliationSectionPayloadValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AffiliationFinancialPayloadValidatorTest extends TestCase
{
    #[DataProvider('validFinancialPayloads')]
    public function test_it_accepts_calculated_financial_values(array $payload): void
    {
        (new AffiliationSectionPayloadValidator)->validateCompleted(
            AffiliationApplicationStep::Financial,
            $payload,
        );

        $this->addToAssertionCount(1);
    }

    public function test_it_rejects_an_inconsistent_calculated_total(): void
    {
        $payload = $this->financialPayload();
        $payload['totalIncome'] = '999';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('total de ingresos');

        (new AffiliationSectionPayloadValidator)->validateCompleted(
            AffiliationApplicationStep::Financial,
            $payload,
        );
    }

    public function test_it_accepts_the_ten_billion_money_limit(): void
    {
        $payload = $this->financialPayload([
            'principalIncome' => '10000000000',
            'otherIncome' => '0',
            'totalIncome' => '10000000000',
            'assetsValue' => '10000000000',
            'liabilitiesValue' => '0',
            'equityValue' => '10000000000',
        ]);

        (new AffiliationSectionPayloadValidator)->validateCompleted(
            AffiliationApplicationStep::Financial,
            $payload,
        );

        $this->addToAssertionCount(1);
    }

    public function test_it_rejects_money_above_ten_billion(): void
    {
        $payload = $this->financialPayload([
            'principalIncome' => '10000000001',
            'otherIncome' => '0',
            'totalIncome' => '10000000001',
        ]);

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('supera el limite de monto permitido');

        (new AffiliationSectionPayloadValidator)->validateCompleted(
            AffiliationApplicationStep::Financial,
            $payload,
        );
    }

    public function test_it_requires_principal_income_to_match_monthly_salary(): void
    {
        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('debe coincidir con el salario mensual');

        (new AffiliationSectionPayloadValidator)->validateIncomeConsistency(
            ['monthlySalary' => '2500000'],
            self::financialPayload(['principalIncome' => '2400000']),
        );
    }

    public static function validFinancialPayloads(): array
    {
        return [
            'positive equity' => [self::financialPayload()],
            'negative equity' => [self::financialPayload([
                'assetsValue' => '5000000',
                'liabilitiesValue' => '7000000',
                'equityValue' => '-2000000',
            ])],
        ];
    }

    private static function financialPayload(array $overrides = []): array
    {
        return array_merge([
            'principalIncome' => '2500000',
            'otherIncome' => '500000',
            'totalIncome' => '3000000',
            'monthlyExpenses' => '1200000',
            'financialObligations' => '300000',
            'totalExpenses' => '1500000',
            'assetsValue' => '15000000',
            'liabilitiesValue' => '5000000',
            'equityValue' => '10000000',
            'incomeBand' => '$2 a $5 millones',
            'voluntarySavings' => 'No',
            'voluntarySavingsValue' => '',
        ], $overrides);
    }
}
