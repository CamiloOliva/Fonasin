<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaContractTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  list<string>  $columns
     */
    private function assertForeignKey(
        string $table,
        array $columns,
        string $foreignTable,
        string $onDelete = 'restrict',
    ): void {
        $foreignKey = collect(Schema::getForeignKeys($table))->first(
            fn (array $key): bool => $key['columns'] === $columns
                && $key['foreign_table'] === $foreignTable
        );

        $this->assertNotNull($foreignKey, "Missing foreign key on {$table}.");
        $this->assertSame($onDelete, $foreignKey['on_delete']);
    }

    /**
     * @param  list<string>  $columns
     */
    private function assertIndex(string $table, array $columns, bool $unique = false): void
    {
        $index = collect(Schema::getIndexes($table))->first(
            fn (array $index): bool => $index['columns'] === $columns
                && $index['unique'] === $unique
        );

        $this->assertNotNull($index, "Missing index on {$table}.");
    }

    public function test_identity_schema_has_uuid_users_and_roles(): void
    {
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasColumns('users', [
            'id',
            'email',
            'document_type',
            'document_number_hash',
            'document_number_encrypted',
            'password',
            'must_change_password',
            'status',
        ]));
        $this->assertTrue(Schema::hasTable('roles'));
        $this->assertTrue(Schema::hasColumns('roles', ['id', 'name']));
        $this->assertTrue(Schema::hasTable('role_user'));
        $this->assertTrue(Schema::hasColumns('role_user', ['user_id', 'role_id', 'created_at']));
    }

    public function test_affiliation_schema_keeps_sensitive_data_separated_by_section(): void
    {
        $this->assertTrue(Schema::hasTable('associates'));
        $this->assertTrue(Schema::hasColumns('associates', [
            'id',
            'user_id',
            'document_type',
            'document_number_hash',
            'document_number_encrypted',
            'status',
        ]));
        $this->assertTrue(Schema::hasTable('affiliation_applications'));
        $this->assertTrue(Schema::hasColumns('affiliation_applications', [
            'id',
            'associate_id',
            'status',
            'current_step',
            'reviewed_by_user_id',
        ]));
        $this->assertTrue(Schema::hasTable('application_sections'));
        $this->assertTrue(Schema::hasColumns('application_sections', [
            'application_id',
            'section',
            'schema_version',
            'data_encrypted',
        ]));

        $this->assertForeignKey('application_sections', ['application_id'], 'affiliation_applications');
        $this->assertIndex('application_sections', ['application_id', 'section'], true);
    }

    public function test_affiliation_documents_and_consents_have_the_expected_contract(): void
    {
        $this->assertTrue(Schema::hasTable('application_documents'));
        $this->assertTrue(Schema::hasColumns('application_documents', [
            'id',
            'application_id',
            'document_type',
            'original_filename',
            'storage_key',
            'mime_type',
            'byte_size',
            'status',
            'uploaded_at',
        ]));
        $this->assertForeignKey('application_documents', ['application_id'], 'affiliation_applications');
        $this->assertIndex('application_documents', ['storage_key'], true);
        $this->assertIndex('application_documents', ['application_id', 'status']);

        $this->assertTrue(Schema::hasTable('consent_records'));
        $this->assertTrue(Schema::hasColumns('consent_records', [
            'id',
            'application_id',
            'consent_type',
            'policy_version',
            'accepted_at',
            'ip_hash',
        ]));
        $this->assertForeignKey('consent_records', ['application_id'], 'affiliation_applications');
        $this->assertIndex('consent_records', ['application_id', 'consent_type']);
        $this->assertIndex(
            'consent_records',
            ['application_id', 'consent_type', 'policy_version'],
            true
        );
    }

    public function test_credit_accounts_have_the_expected_contract(): void
    {
        $this->assertTrue(Schema::hasTable('credit_accounts'));
        $this->assertTrue(Schema::hasColumns('credit_accounts', [
            'id',
            'associate_id',
            'credit_line',
            'initial_balance',
            'current_balance',
            'term_months',
            'interest_rate',
            'installment_amount',
            'status',
            'registered_by_user_id',
        ]));
        $this->assertForeignKey('credit_accounts', ['associate_id'], 'associates');
        $this->assertForeignKey('credit_accounts', ['registered_by_user_id'], 'users');
        $this->assertIndex('credit_accounts', ['associate_id', 'status']);
    }

    public function test_fpqrs_submissions_have_the_expected_contract(): void
    {
        $this->assertTrue(Schema::hasTable('fpqrs_submissions'));
        $this->assertTrue(Schema::hasColumns('fpqrs_submissions', [
            'id',
            'full_name',
            'email',
            'email_hash',
            'submission_type',
            'message',
            'attachment_original_filename',
            'attachment_storage_key',
            'attachment_mime_type',
            'attachment_byte_size',
            'delivery_status',
            'submitted_at',
            'ip_hash',
        ]));

        $this->assertIndex('fpqrs_submissions', ['email_hash']);
        $this->assertIndex('fpqrs_submissions', ['submission_type', 'submitted_at']);
        $this->assertIndex('fpqrs_submissions', ['delivery_status', 'submitted_at']);
    }

    public function test_audit_tables_have_the_expected_contract(): void
    {
        $this->assertTrue(Schema::hasTable('audit_events'));
        $this->assertTrue(Schema::hasColumns('audit_events', [
            'id',
            'occurred_at',
            'actor_user_id',
            'actor_type',
            'module',
            'action',
            'subject_type',
            'subject_id',
            'correlation_id',
            'ip_hash',
            'metadata',
        ]));
        $this->assertForeignKey('audit_events', ['actor_user_id'], 'users');
        $this->assertIndex('audit_events', ['subject_type', 'subject_id', 'occurred_at']);
        $this->assertIndex('audit_events', ['actor_user_id', 'occurred_at']);
        $this->assertIndex('audit_events', ['module', 'action', 'occurred_at']);
        $this->assertIndex('audit_events', ['correlation_id']);

        $this->assertTrue(Schema::hasTable('auth_events'));
        $this->assertTrue(Schema::hasColumns('auth_events', [
            'id',
            'occurred_at',
            'user_id',
            'event_type',
            'email_hash',
            'ip_hash',
            'user_agent_hash',
            'correlation_id',
            'metadata',
        ]));
        $this->assertForeignKey('auth_events', ['user_id'], 'users');
        $this->assertIndex('auth_events', ['user_id', 'occurred_at']);
        $this->assertIndex('auth_events', ['event_type', 'occurred_at']);
        $this->assertIndex('auth_events', ['email_hash', 'occurred_at']);
        $this->assertIndex('auth_events', ['correlation_id']);
    }

    public function test_database_seeder_creates_the_initial_roles(): void
    {
        $this->seed();

        $this->assertDatabaseCount('roles', 3);
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
        $this->assertDatabaseHas('roles', ['name' => 'reviewer']);
        $this->assertDatabaseHas('roles', ['name' => 'associate']);
    }
}
