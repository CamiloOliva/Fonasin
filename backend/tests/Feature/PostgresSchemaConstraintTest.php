<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PostgresSchemaConstraintTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL-specific schema contract.');
        }
    }

    public function test_financial_and_document_check_constraints_exist(): void
    {
        $constraints = [
            'application_documents_byte_size_positive_check' => ['byte_size', '>'],
            'credit_accounts_initial_balance_nonnegative_check' => ['initial_balance', '>='],
            'credit_accounts_current_balance_nonnegative_check' => ['current_balance', '>='],
            'credit_accounts_term_months_positive_check' => ['term_months', '>'],
            'credit_accounts_interest_rate_nonnegative_check' => ['interest_rate', '>='],
            'credit_accounts_installment_amount_nonnegative_check' => ['installment_amount', '>='],
        ];

        foreach ($constraints as $constraint => [$column, $operator]) {
            $definition = DB::table('pg_constraint')
                ->where('conname', $constraint)
                ->selectRaw('pg_get_constraintdef(oid) as definition')
                ->value('definition');

            $this->assertNotNull($definition, "Missing PostgreSQL constraint {$constraint}.");
            $this->assertMatchesRegularExpression(
                sprintf('/%s\s*%s\s*\(?0/', preg_quote($column, '/'), preg_quote($operator, '/')),
                $definition
            );
        }
    }

    public function test_audit_metadata_uses_jsonb(): void
    {
        $this->assertSame('jsonb', Schema::getColumnType('audit_events', 'metadata', true));
        $this->assertSame('jsonb', Schema::getColumnType('auth_events', 'metadata', true));
    }
}
