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
