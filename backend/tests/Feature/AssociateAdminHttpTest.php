<?php

namespace Tests\Feature;

use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AssociateAdminHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_associates(): void
    {
        $this->getJson('/admin/associates')->assertUnauthorized();
    }

    public function test_user_without_backoffice_role_cannot_manage_associates(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/admin/associates')
            ->assertForbidden();
    }

    public function test_reviewer_can_list_associates_without_sensitive_document_values(): void
    {
        $reviewer = $this->userWithRole('reviewer');
        $associate = $this->createAssociate();

        $response = $this->actingAs($reviewer)->getJson('/admin/associates');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $associate->id)
            ->assertJsonMissingPath('data.0.document_number_hash')
            ->assertJsonMissingPath('data.0.document_number_encrypted');
    }

    public function test_admin_can_create_associate_manually(): void
    {
        $admin = $this->userWithRole('admin');

        $response = $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Sintetica',
                'status' => 'active',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.document_type', 'CC')
            ->assertJsonPath('data.full_name', 'Persona Sintetica')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonMissingPath('data.document_number_hash')
            ->assertJsonMissingPath('data.document_number_encrypted');

        $associateId = $response->json('data.id');
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->id,
            'action' => AffiliationAuditAction::AssociateCreated->value,
            'subject_id' => $associateId,
        ]);
    }

    public function test_it_rejects_duplicate_document_numbers(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Uno',
            ])
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Dos',
            ])
            ->assertUnprocessable();
    }

    public function test_admin_can_deactivate_and_activate_associate(): void
    {
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate();

        $this->actingAs($admin)
            ->postJson("/admin/associates/{$associate->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->id,
            'action' => AffiliationAuditAction::AssociateDeactivated->value,
            'subject_id' => $associate->id,
        ]);

        $this->actingAs($admin)
            ->postJson("/admin/associates/{$associate->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->id,
            'action' => AffiliationAuditAction::AssociateActivated->value,
            'subject_id' => $associate->id,
        ]);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }

    private function createAssociate(): Associate
    {
        $reference = (string) Str::uuid();

        return Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', $reference),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Test Person',
            'status' => 'active',
        ]);
    }
}
