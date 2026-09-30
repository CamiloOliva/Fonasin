<?php

namespace Tests\Unit;

use App\Application\Imports\Support\LocalizedNumberParser;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class LocalizedMoneyParserTest extends TestCase
{
    #[DataProvider('money')]
    public function test_money_is_parsed_without_floating_point_conversion(string $input, ?string $expected): void
    {
        $this->assertSame($expected, (new LocalizedNumberParser)->parse($input, 2));
    }

    public static function money(): array
    {
        return [
            ['1.000', '1000.00'], ['1,000', '1000.00'],
            ['1.000.000', '1000000.00'], ['1,000,000', '1000000.00'],
            ['COP 1.250.000,50', '1250000.50'], ['$1,250,000.50', '1250000.50'],
            ['999999999999.99', '999999999999.99'],
            ['999999999999.995', '1000000000000.00'],
            ['9.995', '9995.00'], ['1000.995', '1001.00'],
            ['0.005', '0.01'], ['0.05', '0.05'],
            ['1,00,000', null], ['12.34.567', null], ['1.2,3', null],
            ['1,234.5.6', null], ['-1.000', '-1000.00'], ['-0.00', '0.00'],
        ];
    }

    public function test_four_decimal_rates_remain_decimal_not_thousands(): void
    {
        $this->assertSame('1.2340', (new LocalizedNumberParser)->parse('1.234', 4));
    }
}
