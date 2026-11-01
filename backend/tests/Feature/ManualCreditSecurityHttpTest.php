<?php

namespace Tests\Feature;

use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ManualCreditSecurityHttpTest extends TestCase
{
    use RefreshDatabase;

    private function payload(): array
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin']));
        $this->actingAs($admin);
        $associate = Associate::query()->create([
            'document_type' => 'CC', 'document_number_hash' => hash('sha256', $admin->id),
            'document_number_encrypted' => 'synthetic-test-only', 'full_name' => 'Synthetic Credit Security', 'status' => 'active',
        ]);

        return [
            'associate_id' => $associate->id, 'credit_line' => 'FONALIBRE',
            'initial_balance' => '1250000.50', 'current_balance' => '1000000.25', 'installment_amount' => '52000.75',
            'term_months' => 24, 'interest_rate' => '1.2500', 'interest_rate_nominal_annual' => '18.0000',
            'last_payment_date' => '2026-10-30',
        ];
    }

    public static function invalidDecimals(): array
    {
        $cases = [];
        foreach (['initial_balance', 'current_balance', 'installment_amount'] as $field) {
            foreach (['extra cents' => '123.456', 'scientific string' => '1e3', 'large fractional tail' => '999999999999.991',
                'JSON float' => 12.50, 'boolean' => true, 'array' => [], 'localized text' => '1.250,50'] as $case => $value) {
                $cases["$field/$case"] = [$field, $value];
            }
        }
        foreach (['interest_rate', 'interest_rate_nominal_annual'] as $field) {
            foreach (['excess scale' => '1.23456', 'scientific string' => '1e1', 'JSON float' => 1.5, 'above maximum' => '100.0001'] as $case => $value) {
                $cases["$field/$case"] = [$field, $value];
            }
        }

        return $cases;
    }

    #[DataProvider('invalidDecimals')]
    public function test_post_and_patch_never_round_or_coerce_invalid_financial_values(string $field, mixed $value): void
    {
        $payload = $this->payload();
        $this->postJson('/admin/credits', array_replace($payload, [$field => $value]))
            ->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount('credit_accounts', 0);
        $created = $this->postJson('/admin/credits', $payload)->assertCreated();
        $id = $created->json('data.id');
        $before = CreditAccount::query()->findOrFail($id)->getAttributes();
        $this->patchJson("/admin/credits/$id", [$field => $value])->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertSame($before, CreditAccount::query()->findOrFail($id)->getAttributes());
        $this->assertDatabaseMissing('audit_events', ['subject_id' => $id, 'action' => 'credit.updated']);
    }

    public function test_maximum_cents_and_integer_zero_survive_the_http_boundary(): void
    {
        $payload = array_replace($this->payload(), [
            'initial_balance' => '999999999999.99', 'current_balance' => 0, 'installment_amount' => '0.01',
            'interest_rate' => '100.0000', 'interest_rate_nominal_annual' => null,
        ]);
        $this->postJson('/admin/credits', $payload)->assertCreated()
            ->assertJsonPath('data.initial_balance', '999999999999.99')
            ->assertJsonPath('data.current_balance', '0.00')->assertJsonPath('data.installment_amount', '0.01');
    }

    public function test_raw_json_floats_cannot_hide_fractional_digits_in_the_parser(): void
    {
        $payload = $this->payload();
        unset($payload['initial_balance']);
        foreach (['100.0', '1e3', '12.0000000000000000001', '100000000000.00001'] as $literal) {
            $body = substr(json_encode($payload, JSON_THROW_ON_ERROR), 0, -1).',"initial_balance":'.$literal.'}';
            $this->call('POST', '/admin/credits', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], $body)
                ->assertUnprocessable()->assertJsonValidationErrors('initial_balance');
        }
        $this->assertDatabaseCount('credit_accounts', 0);
    }

    public function test_patch_cannot_introduce_an_unknown_credit_line(): void
    {
        $created = $this->postJson('/admin/credits', $this->payload())->assertCreated();
        $id = $created->json('data.id');
        $this->patchJson("/admin/credits/$id", ['credit_line' => 'LINEA_NO_AUTORIZADA'])
            ->assertUnprocessable()->assertJsonValidationErrors('credit_line');
        $this->assertSame('FONALIBRE', CreditAccount::query()->findOrFail($id)->credit_line);
    }

    public function test_manual_calendar_date_is_within_the_database_contract(): void
    {
        $payload = $this->payload();
        foreach (['0000-01-01', '0001-01-01', '10000-01-01'] as $date) {
            $this->postJson('/admin/credits', array_replace($payload, ['last_payment_date' => $date]))
                ->assertUnprocessable()->assertJsonValidationErrors('last_payment_date');
        }
        $this->assertDatabaseCount('credit_accounts', 0);
    }
}
