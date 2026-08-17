<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_identity_schema_has_uuid_users_and_roles(): void
    {
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasColumns('users', ['id', 'email', 'password', 'status']));
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
    }

    public function test_database_seeder_uses_the_current_users_contract(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'status' => 'active',
        ]);
    }
}
