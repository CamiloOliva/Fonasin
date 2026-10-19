<?php

namespace Tests\Unit;

use App\Infrastructure\Portal\SimpleXlsxAssociateProfileExporter;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shuchkin\SimpleXLSX;

class AssociateProfileSpreadsheetSecurityTest extends TestCase
{
    public static function untrustedText(): array
    {
        return [
            'formula tag' => ['<f>1+1</f>'],
            'cached formula tag' => ['<f v="2">1+1</f>'],
            'external link' => ['<a href="https://example.test/">Synthetic</a>'],
            'formatting tag' => ['<b>Synthetic</b>'],
            'raw tag' => ['<raw><f>1+1</f></raw>'],
            'comment tag' => ['<!-- Synthetic -->'],
            'ordinary text' => ['Ingenieria & operaciones'],
        ];
    }

    #[DataProvider('untrustedText')]
    public function test_values_keys_and_categories_are_literal_not_generator_markup(string $text): void
    {
        $bytes = (new SimpleXlsxAssociateProfileExporter)->spreadsheet([
            'associate' => [$text => $text],
            'form' => ['application' => ['sections' => [['section' => $text, 'data' => ['profession' => $text]]]]],
        ]);
        $xlsx = SimpleXLSX::parseData($bytes);
        $this->assertNotFalse($xlsx);
        $this->assertSame($text, $xlsx->rows()[2][1]);
        $this->assertSame($text, $xlsx->rows()[2][2]);
        $this->assertSame('Formulario / '.$text, $xlsx->rows()[3][0]);
        $sheet = $xlsx->getEntryData('xl/worksheets/sheet1.xml');
        $this->assertDoesNotMatchRegularExpression('/<f(?:\s|>)/', $sheet);
        $this->assertStringNotContainsString('<hyperlink', $sheet);
        $this->assertStringNotContainsString('<legacyDrawing', $sheet);
    }

    public function test_numeric_boolean_and_formula_prefix_contract_remains_compatible(): void
    {
        $xlsx = SimpleXLSX::parseData((new SimpleXlsxAssociateProfileExporter)->spreadsheet([
            'associate' => ['amount' => 123.5, 'count' => 2, 'yes' => true, 'empty' => null, 'formula' => '=1+1', 'spaced' => '  +1'],
        ]));
        $this->assertNotFalse($xlsx);
        $rows = $xlsx->rows();
        $this->assertSame(123.5, $rows[2][2]);
        $this->assertSame(2, $rows[3][2]);
        $this->assertSame('Si', $rows[4][2]);
        $this->assertSame('', $rows[5][2]);
        $this->assertSame("'=1+1", $rows[6][2]);
        $this->assertSame("'  +1", $rows[7][2]);
    }

    public function test_spanish_labels_numeric_money_and_text_identifiers_are_preserved_in_actual_xlsx(): void
    {
        $xlsx = SimpleXLSX::parseData((new SimpleXlsxAssociateProfileExporter)->spreadsheet([
            'associate' => ['document_number' => '0012345678', 'full_name' => 'Persona Sintetica', 'mobile' => '03001234567'],
            'form' => ['application' => ['sections' => [['section' => 'financial', 'data' => ['totalIncome' => '20000000000', 'equityValue' => '-500.25']]]]],
            'credits' => ['items' => [['initial_balance' => '1000000.25', 'promissory_note_number' => '000123']]],
            'contributions' => ['account' => ['total_balance' => '123456.78'], 'movements' => [['amount' => '=1+1']]],
        ]));
        $this->assertNotFalse($xlsx);
        $values = [];
        foreach (array_slice($xlsx->rows(), 2) as $row) {
            $values[$row[1]] = $row[2];
        }
        $this->assertSame('0012345678', $values['Numero de documento']);
        $this->assertSame('03001234567', $values['Celular']);
        $this->assertSame('000123', $values['Numero de pagare']);
        $this->assertEquals(20000000000, $values['Total ingresos mensuales']);
        $this->assertIsNumeric($values['Total ingresos mensuales']);
        $this->assertFalse(is_string($values['Total ingresos mensuales']));
        $this->assertEquals(-500.25, $values['Patrimonio']);
        $this->assertFalse(is_string($values['Saldo inicial']));
        $this->assertEquals(123456.78, $values['Saldo total']);
        $this->assertSame("'=1+1", $values['Valor mensual']);
        $sheet = $xlsx->getEntryData('xl/worksheets/sheet1.xml');
        $this->assertDoesNotMatchRegularExpression('/<f(?:\s|>)/', $sheet);
        $this->assertStringNotContainsString('totalIncome', json_encode($xlsx->rows()));
    }
}
