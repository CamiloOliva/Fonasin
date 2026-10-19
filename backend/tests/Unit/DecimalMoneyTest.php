<?php

namespace Tests\Unit;

use App\Domain\Shared\Support\DecimalMoney;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class DecimalMoneyTest extends TestCase
{
    public static function values(): array
    {
        return [
            ['000123.50', '123.5'], ['-000.00', '0'], ['-500.25', '-500.25'], [0, '0'], [12.5, '12.5'],
            ['20000000000.00', '20000000000'], ['999999999999.99', '999999999999.99'],
            ['0.01', '0.01'], ['=123', null], ['1e3', null], ['0.123', null], ['1,23', null],
            ['1.000.000', null], ['$123', null], ['12 3', null], ['123abc', null], ['123.', null],
            ['+123', null], [true, null], [[], null], [null, null], [INF, null], [NAN, null],
            ['1000000000000', null], ['', null],
            [10000000000.0001, null], [20000000000.0001, null], [9999999999.9999, null],
            [10000000000.01, '10000000000.01'], [0.1, '0.1'], [0.1 + 0.2, null],
        ];
    }

    #[DataProvider('values')]
    public function test_decimal_contract_is_strict_and_does_not_round_or_strip_malformed_values(mixed $value, ?string $expected): void
    {
        $this->assertSame($expected, DecimalMoney::canonical($value));
    }

    public function test_float_validation_does_not_depend_on_php_print_or_json_precision(): void
    {
        $precision = ini_get('precision');
        $serializePrecision = ini_get('serialize_precision');
        try {
            foreach ([3, 14, 17] as $setting) {
                ini_set('precision', (string) $setting);
                ini_set('serialize_precision', (string) $setting);
                $this->assertNull(DecimalMoney::canonical(10000000000.0001));
                $this->assertSame('123.45', DecimalMoney::canonical(123.45));
                $this->assertSame('10000000000.01', DecimalMoney::canonical(10000000000.01));
            }
        } finally {
            ini_set('precision', $precision);
            ini_set('serialize_precision', $serializePrecision);
        }
    }
}
