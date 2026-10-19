<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Infrastructure\Portal\SimpleXlsxAssociateProfileExporter;
use App\Models\AffiliationApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\DataProvider;
use Shuchkin\SimpleXLSX;
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class AffiliationMoneyContractTest extends TestCase
{
    use AffiliationSectionPayloads;
    use RefreshDatabase;

    public static function invalidMoney(): array
    {
        return array_map(fn ($value) => [$value], ['=123', '1e3', '0.123', '1,23', '1.000.000', '$123', '123abc', '+123', '12 3', true, ['123']]);
    }

    #[DataProvider('invalidMoney')]
    public function test_invalid_money_is_rejected_without_replacing_persisted_values(mixed $value): void
    {
        $draft = AffiliationApplication::query()->create(['purpose' => 'initial_affiliation', 'status' => 'draft']);
        $token = 'synthetic-money-token';
        $draft->forceFill(['access_token_hash' => hash('sha256', $token)])->save();
        foreach (['employment' => 'monthlySalary', 'financial' => 'otherIncome'] as $section => $field) {
            $url = URL::temporarySignedRoute('affiliation-applications.sections.store', now()->addHour(), ['application' => $draft, 'section' => $section], false);
            $data = $this->validSectionPayload(AffiliationApplicationStep::from($section));
            $headers = ['X-Affiliation-Draft-Token' => $token];
            $this->postJson($url, ['schema_version' => 1, 'data' => $data], $headers)->assertOk();
            $stored = $draft->sections()->where('section', $section)->firstOrFail()->getAttribute('data_encrypted');
            foreach ([true, false] as $completed) {
                $this->postJson($url, ['schema_version' => 1, 'completed' => $completed, 'data' => [...$data, $field => $value]], $headers)->assertUnprocessable();
                $this->assertSame($stored, $draft->sections()->where('section', $section)->firstOrFail()->getAttribute('data_encrypted'));
            }
        }
    }

    public function test_valid_money_round_trips_from_http_to_encrypted_data_and_numeric_excel(): void
    {
        $draft = AffiliationApplication::query()->create(['purpose' => 'initial_affiliation', 'status' => 'draft', 'access_token_hash' => hash('sha256', 'synthetic-money-token')]);
        $data = $this->validSectionPayload(AffiliationApplicationStep::Financial);
        $data = [...$data, 'otherIncome' => '000123.50', 'totalIncome' => '2500123.50', 'assetsValue' => 0, 'liabilitiesValue' => '500.25', 'equityValue' => '-500.25'];
        $url = URL::temporarySignedRoute('affiliation-applications.sections.store', now()->addHour(), ['application' => $draft, 'section' => 'financial'], false);
        $this->postJson($url, ['schema_version' => 1, 'data' => $data], ['X-Affiliation-Draft-Token' => 'synthetic-money-token'])->assertOk();
        $section = $draft->sections()->firstOrFail();
        $stored = app(EncryptsSensitiveData::class)->decryptArray($section->getAttribute('data_encrypted'));
        $this->assertSame('123.5', $stored['otherIncome']);
        $this->assertSame('0', $stored['assetsValue']);
        $this->assertSame('-500.25', $stored['equityValue']);
        $xlsx = SimpleXLSX::parseData((new SimpleXlsxAssociateProfileExporter)->spreadsheet(['form' => ['application' => ['sections' => [['section' => 'financial', 'data' => $stored]]]]]));
        $this->assertNotFalse($xlsx);
        $values = [];
        foreach (array_slice($xlsx->rows(), 2) as $row) {
            $values[$row[1]] = $row[2];
        }
        $this->assertSame(123.5, $values['Otros ingresos mensuales']);
        $this->assertSame(-500.25, $values['Patrimonio']);
        $this->assertFalse(is_string($values['Total ingresos mensuales']));
        $this->assertDoesNotMatchRegularExpression('/<f(?:\s|>)/', $xlsx->getEntryData('xl/worksheets/sheet1.xml'));
        $html = view('pdf.affiliation.summary', ['application' => $draft, 'sections' => ['financial' => $stored], 'signature' => [], 'logoDataUri' => null])->render();
        $this->assertStringContainsString('$ 123,5', $html);
        $this->assertStringContainsString('$ -500,25', $html);
        $payrollData = array_fill_keys(['city', 'signature_date_label', 'full_name', 'document_number', 'issue_place', 'employer', 'phone', 'email', 'start_month', 'start_year'], 'Synthetic');
        $payroll = view('pdf.affiliation.payroll-authorization', ['application' => $draft, 'sections' => [], 'payroll' => [...$payrollData, 'monthly_salary' => 2500000.5, 'mandatory_contribution' => 37500.01, 'voluntary_savings_applies' => true, 'voluntary_savings_value' => 123.5, 'total_discount' => 37623.51, 'signature' => []], 'logoDataUri' => null])->render();
        $this->assertStringContainsString('$ 2.500.000,5', $payroll);
        $this->assertStringContainsString('$ 37.623,51', $payroll);
    }

    public static function moneyFields(): array
    {
        return array_map(fn ($field) => [$field], ['principalIncome', 'otherIncome', 'totalIncome', 'monthlyExpenses', 'financialObligations', 'totalExpenses', 'assetsValue', 'liabilitiesValue', 'equityValue', 'voluntarySavingsValue']);
    }

    #[DataProvider('moneyFields')]
    public function test_every_declared_financial_money_field_rejects_malformed_partial_and_completed_input(string $field): void
    {
        $draft = AffiliationApplication::query()->create(['purpose' => 'initial_affiliation', 'status' => 'draft', 'access_token_hash' => hash('sha256', 'synthetic-money-token')]);
        $url = URL::temporarySignedRoute('affiliation-applications.sections.store', now()->addHour(), ['application' => $draft, 'section' => 'financial'], false);
        foreach ([false, true] as $completed) {
            $this->postJson($url, ['schema_version' => 1, 'completed' => $completed, 'data' => [...$this->validSectionPayload(AffiliationApplicationStep::Financial), $field => '=123']], ['X-Affiliation-Draft-Token' => 'synthetic-money-token'])->assertUnprocessable();
        }
        $this->assertDatabaseCount('application_sections', 0);
    }
}
