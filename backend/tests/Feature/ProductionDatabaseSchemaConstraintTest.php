<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProductionDatabaseSchemaConstraintTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (! in_array(DB::getDriverName(), ['pgsql', 'mariadb'], true)) {
            $this->markTestSkipped('Production database schema contract.');
        }
    }

    public function test_mariadb_version_meets_the_production_minimum(): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('MariaDB-specific version contract.');
        }

        $reportedVersion = (string) DB::scalar('SELECT VERSION()');
        preg_match('/^\d+\.\d+\.\d+/', $reportedVersion, $matches);

        $this->assertNotEmpty($matches[0] ?? null, 'MariaDB did not report a semantic version.');
        $this->assertTrue(
            version_compare($matches[0], '10.11.0', '>='),
            "MariaDB {$reportedVersion} is older than the supported production minimum 10.11.",
        );
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
            'contribution_accounts_balances_nonnegative_check' => ['total_balance', '>='],
            'contribution_accounts_contribution_balance_nonnegative_check' => ['contribution_balance', '>='],
            'contribution_movements_amount_nonnegative_check' => ['amount', '>='],
        ];

        foreach ($constraints as $constraint => [$column, $operator]) {
            $definition = $this->constraintDefinition($constraint);

            $this->assertNotNull($definition, "Missing production database constraint {$constraint}.");
            $this->assertMatchesRegularExpression(
                sprintf('/`?%s`?\s*%s\s*\(?0/', preg_quote($column, '/'), preg_quote($operator, '/')),
                $definition
            );
        }
    }

    public function test_audit_metadata_uses_supported_structured_storage(): void
    {
        $expectedType = DB::getDriverName() === 'pgsql' ? 'json' : 'longtext';

        $this->assertSame($expectedType, Schema::getColumnType('audit_events', 'metadata'));
        $this->assertSame($expectedType, Schema::getColumnType('auth_events', 'metadata'));
        $this->assertSame($expectedType, Schema::getColumnType('import_batches', 'errors'));
    }

    public function test_affiliation_application_purpose_is_restricted(): void
    {
        $this->expectException(QueryException::class);

        DB::table('affiliation_applications')->insert([
            'id' => (string) Str::uuid(),
            'purpose' => 'unsupported-purpose',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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

    #[DataProvider('invalidContributionAccountValues')]
    public function test_contribution_account_balances_cannot_be_negative(string $column): void
    {
        $userId = $this->createUser();
        $associateId = $this->createAssociate($userId);
        $account = [
            'id' => (string) Str::uuid(),
            'associate_id' => $associateId,
            'contribution_balance' => 0,
            'permanent_savings_balance' => 0,
            'voluntary_savings_balance' => 0,
            'total_balance' => 0,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $account[$column] = -0.01;

        $this->expectException(QueryException::class);

        DB::table('contribution_accounts')->insert($account);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidContributionAccountValues(): array
    {
        return [
            'negative contribution balance' => ['contribution_balance'],
            'negative permanent savings balance' => ['permanent_savings_balance'],
            'negative voluntary savings balance' => ['voluntary_savings_balance'],
            'negative total balance' => ['total_balance'],
        ];
    }

    #[DataProvider('invalidContributionMovementValues')]
    public function test_contribution_movement_values_cannot_be_negative(string $column): void
    {
        $userId = $this->createUser();
        $associateId = $this->createAssociate($userId);
        $accountId = (string) Str::uuid();

        DB::table('contribution_accounts')->insert([
            'id' => $accountId,
            'associate_id' => $associateId,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $movement = [
            'id' => (string) Str::uuid(),
            'contribution_account_id' => $accountId,
            'associate_id' => $associateId,
            'movement_type' => 'contribution',
            'period' => '2026-09-01',
            'cut_off_date' => '2026-09-30',
            'amount' => 100,
            'balance_after' => 100,
            'status' => 'registered',
            'source' => 'manual',
            'reference' => 'TEST-REF-'.Str::uuid(),
            'source_row_hash' => hash('sha256', (string) Str::uuid()),
            'recorded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $movement[$column] = -0.01;

        $this->expectException(QueryException::class);

        DB::table('contribution_movements')->insert($movement);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidContributionMovementValues(): array
    {
        return [
            'negative movement amount' => ['amount'],
            'negative movement resulting balance' => ['balance_after'],
        ];
    }

    public function test_only_one_active_draft_is_allowed_per_associate(): void
    {
        $userId = $this->createUser();
        $associateId = $this->createAssociate($userId);

        $this->insertAffiliationApplication($associateId, 'draft');

        $this->expectException(QueryException::class);

        $this->insertAffiliationApplication($associateId, 'draft');
    }

    public function test_non_draft_applications_and_another_associates_draft_can_coexist(): void
    {
        $firstAssociateId = $this->createAssociate($this->createUser());
        $secondAssociateId = $this->createAssociate($this->createUser());

        $this->insertAffiliationApplication($firstAssociateId, 'draft');
        $this->insertAffiliationApplication($firstAssociateId, 'submitted');
        $this->insertAffiliationApplication($firstAssociateId, 'approved');
        $this->insertAffiliationApplication($secondAssociateId, 'draft');

        $this->assertSame(
            3,
            DB::table('affiliation_applications')->where('associate_id', $firstAssociateId)->count(),
        );
        $this->assertSame(
            1,
            DB::table('affiliation_applications')->where('associate_id', $secondAssociateId)->count(),
        );
    }

    public function test_mariadb_active_draft_constraint_uses_a_generated_unique_column(): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('MariaDB-specific generated column contract.');
        }

        $column = DB::table('information_schema.columns')
            ->where('table_schema', DB::connection()->getDatabaseName())
            ->where('table_name', 'affiliation_applications')
            ->where('column_name', 'active_draft_associate_id')
            ->first(['extra', 'generation_expression']);

        $this->assertNotNull($column, 'Missing MariaDB generated column for active drafts.');
        $this->assertStringContainsString('STORED GENERATED', strtoupper((string) $column->extra));
        $this->assertMatchesRegularExpression(
            '/status.*draft.*associate_id/i',
            (string) $column->generation_expression,
        );

        $indexedColumns = DB::table('information_schema.statistics')
            ->where('table_schema', DB::connection()->getDatabaseName())
            ->where('table_name', 'affiliation_applications')
            ->where('index_name', 'affiliation_applications_one_active_draft_per_associate')
            ->orderBy('seq_in_index')
            ->pluck('column_name')
            ->all();

        $this->assertSame(['active_draft_associate_id'], $indexedColumns);
    }

    public function test_only_one_pending_voluntary_savings_request_is_allowed_per_associate(): void
    {
        $associateId = $this->createAssociate($this->createUser());

        $this->insertVoluntarySavingsRequest($associateId, $associateId);

        $this->expectException(QueryException::class);

        $this->insertVoluntarySavingsRequest($associateId, $associateId);
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

    private function insertAffiliationApplication(string $associateId, string $status): void
    {
        DB::table('affiliation_applications')->insert([
            'id' => (string) Str::uuid(),
            'associate_id' => $associateId,
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertVoluntarySavingsRequest(string $associateId, ?string $pendingAssociateId): void
    {
        $requestId = (string) Str::uuid();

        DB::table('voluntary_savings_requests')->insert([
            'id' => $requestId,
            'associate_id' => $associateId,
            'pending_associate_id' => $pendingAssociateId,
            'monthly_amount' => 100000,
            'status' => $pendingAssociateId ? 'submitted' : 'approved',
            'authorization_storage_key' => "private/{$requestId}.pdf",
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function constraintDefinition(string $constraint): ?string
    {
        if (DB::getDriverName() === 'pgsql') {
            return DB::table('pg_constraint')
                ->where('conname', $constraint)
                ->selectRaw('pg_get_constraintdef(oid) as definition')
                ->value('definition');
        }

        return DB::table('information_schema.check_constraints')
            ->where('constraint_schema', DB::connection()->getDatabaseName())
            ->where('constraint_name', $constraint)
            ->value('check_clause');
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
