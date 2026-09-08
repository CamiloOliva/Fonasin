<?php

namespace Tests\Feature;

use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\ImportBatch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class ImportBatchAdminHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_import_batches(): void
    {
        $this->getJson('/admin/import-batches')->assertUnauthorized();
    }

    public function test_associate_cannot_list_import_batches(): void
    {
        $associate = $this->userWithRole('associate');

        $this->actingAs($associate)
            ->getJson('/admin/import-batches')
            ->assertForbidden();
    }

    public function test_reviewer_can_list_import_batches_without_private_storage_values(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');
        $batch = ImportBatch::query()->create([
            'imported_by_user_id' => $admin->id,
            'import_type' => 'contributions',
            'original_filename' => 'aportes.xlsx',
            'storage_key' => 'private/imports/aportes.xlsx',
            'file_hash' => hash('sha256', 'synthetic-file'),
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'byte_size' => 4096,
            'status' => 'completed_with_errors',
            'rows_total' => 10,
            'rows_created' => 8,
            'rows_updated' => 1,
            'rows_rejected' => 1,
            'errors' => [['row' => 7, 'message' => 'Documento no encontrado.']],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($reviewer)
            ->getJson('/admin/import-batches?type=contributions')
            ->assertOk()
            ->assertJsonPath('data.0.id', $batch->id)
            ->assertJsonPath('data.0.import_type', 'contributions')
            ->assertJsonPath('data.0.imported_by.email', 'admin@example.test')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissingPath('data.0.storage_key')
            ->assertJsonMissingPath('data.0.file_hash');

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Imports->value,
            'action' => ImportAuditAction::ImportViewed->value,
            'actor_user_id' => $reviewer->id,
            'metadata->type' => 'contributions',
        ]);
    }

    public function test_only_admin_can_import_batches_by_policy(): void
    {
        $admin = $this->userWithRole('admin', 'admin@example.test');
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');
        $associate = $this->userWithRole('associate', 'associate@example.test');

        $this->assertTrue(Gate::forUser($admin)->allows('import', ImportBatch::class));
        $this->assertFalse(Gate::forUser($reviewer)->allows('import', ImportBatch::class));
        $this->assertFalse(Gate::forUser($associate)->allows('import', ImportBatch::class));
    }

    private function userWithRole(string $roleName, ?string $email = null): User
    {
        $user = User::factory()->create([
            'email' => $email ?? $roleName.'.example@fonasin.test',
            'status' => 'active',
        ]);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
