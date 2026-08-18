<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
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

    #[DataProvider('invalidDocumentSizes')]
    public function test_document_size_must_be_positive(int $byteSize): void
    {
        $applicationId = $this->createAffiliationApplication();

        $this->expectException(QueryException::class);

        DB::table('application_documents')->insert([
            'id' => (string) Str::uuid(),
            'application_id' => $applicationId,
            'document_type' => 'identity',
            'original_filename' => 'test.pdf',
            'storage_key' => 'tests/'.Str::uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => $byteSize,
            'status' => 'uploaded',
            'uploaded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array<string, array{int}>
     */
    public static function invalidDocumentSizes(): array
    {
        return [
            'zero bytes' => [0],
            'negative bytes' => [-1],
        ];
    }

    #[DataProvider('invalidCreditValues')]
    public function test_credit_values_respect_database_checks(string $column, int|float $value): void
    {
        $userId = $this->createUser();
        $associateId = $this->createAssociate($userId);
        $credit = [
            'id' => (string) Str::uuid(),
            'associate_id' => $associateId,
            'credit_line' => 'Test credit',
            'initial_balance' => 1000,
            'current_balance' => 500,
            'term_months' => 12,
            'interest_rate' => 1.5,
            'installment_amount' => 100,
            'status' => 'active',
            'registered_by_user_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $credit[$column] = $value;

        $this->expectException(QueryException::class);

        DB::table('credit_accounts')->insert($credit);
    }

    /**
     * @return array<string, array{string, int|float}>
     */
    public static function invalidCreditValues(): array
    {
        return [
            'negative initial balance' => ['initial_balance', -0.01],
            'negative current balance' => ['current_balance', -0.01],
            'zero term' => ['term_months', 0],
            'negative term' => ['term_months', -1],
            'negative interest rate' => ['interest_rate', -0.0001],
            'negative installment' => ['installment_amount', -0.01],
        ];
    }

    public function test_duplicate_consent_for_the_same_policy_version_is_rejected(): void
    {
        $applicationId = $this->createAffiliationApplication();
        $consent = [
            'application_id' => $applicationId,
            'consent_type' => 'data_processing',
            'policy_version' => '2026-08',
            'accepted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('consent_records')->insert([
            ...$consent,
            'id' => (string) Str::uuid(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('consent_records')->insert([
            ...$consent,
            'id' => (string) Str::uuid(),
        ]);
    }

    public function test_application_with_a_section_cannot_be_deleted(): void
    {
        $applicationId = $this->createAffiliationApplication();

        DB::table('application_sections')->insert([
            'id' => (string) Str::uuid(),
            'application_id' => $applicationId,
            'section' => 'personal_data',
            'schema_version' => 1,
            'data_encrypted' => 'test-ciphertext',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('affiliation_applications')->where('id', $applicationId)->delete();
    }

    private function createAffiliationApplication(): string
    {
        $applicationId = (string) Str::uuid();

        DB::table('affiliation_applications')->insert([
            'id' => $applicationId,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $applicationId;
    }

    private function createUser(): string
    {
        $userId = (string) Str::uuid();

        DB::table('users')->insert([
            'id' => $userId,
            'email' => $userId.'@example.test',
            'password' => 'not-used-in-schema-tests',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $userId;
    }

    private function createAssociate(string $userId): string
    {
        $associateId = (string) Str::uuid();

        DB::table('associates')->insert([
            'id' => $associateId,
            'user_id' => $userId,
            'document_type' => 'test',
            'document_number_hash' => hash('sha256', $associateId),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Test Person',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $associateId;
    }
}
