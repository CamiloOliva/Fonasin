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
        ];
    }

    #[DataProvider('values')]
    public function test_decimal_contract_is_strict_and_does_not_round_or_strip_malformed_values(mixed $value, ?string $expected): void
    {
        $this->assertSame($expected, DecimalMoney::canonical($value));
    }
}
