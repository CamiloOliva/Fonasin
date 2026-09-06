<?php

namespace Tests\Feature;

use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        $associate = $this->createAssociate([
            'document_number_hash' => hash('sha256', '1234567890'),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray([
                'document_number' => '1234567890',
            ]),
        ]);

        $response = $this->actingAs($reviewer)->getJson('/admin/associates');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $associate->id)
            ->assertJsonPath('data.0.document_number_masked', '******7890')
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.total', 1)
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
                'email' => 'persona.sintetica@fonasin.test',
                'status' => 'active',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.document_type', 'CC')
            ->assertJsonPath('data.document_number_masked', '******7890')
            ->assertJsonPath('data.full_name', 'Persona Sintetica')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.user.email', 'persona.sintetica@fonasin.test')
            ->assertJsonPath('data.activation_required', true)
            ->assertJsonMissingPath('data.temporary_password')
            ->assertJsonMissingPath('data.document_number_hash')
            ->assertJsonMissingPath('data.document_number_encrypted');

        $associateId = $response->json('data.id');
        $user = User::query()->where('email', 'persona.sintetica@fonasin.test')->firstOrFail();
        $this->assertTrue($user->must_change_password);
        $this->assertTrue($user->roles()->where('name', 'associate')->exists());
        $this->assertDatabaseHas('associates', [
            'id' => $associateId,
            'user_id' => $user->id,
        ]);
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
                'email' => 'persona.uno@fonasin.test',
            ])
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Dos',
                'email' => 'persona.dos@fonasin.test',
            ])
            ->assertUnprocessable();
    }

    public function test_admin_can_create_associate_without_exposing_portal_password(): void
    {
        $admin = $this->userWithRole('admin');

        $response = $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '9876543210',
                'full_name' => 'Persona Con Acceso',
                'email' => 'persona.acceso@fonasin.test',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'persona.acceso@fonasin.test')
            ->assertJsonPath('data.activation_required', true)
            ->assertJsonMissingPath('data.temporary_password');

        $user = User::query()->where('email', 'persona.acceso@fonasin.test')->firstOrFail();
        $this->assertTrue($user->must_change_password);
        $this->assertTrue($user->roles()->where('name', 'associate')->exists());
    }

    public function test_it_rejects_existing_user_with_different_document(): void
    {
        $admin = $this->userWithRole('admin');
        User::factory()->create([
            'email' => 'persona.existente@fonasin.test',
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', '9999999999'),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray([
                'document_number' => '9999999999',
            ]),
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Duplicada',
                'email' => 'persona.existente@fonasin.test',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El correo indicado ya existe con un documento diferente.');
    }

    public function test_it_rejects_existing_document_on_another_user(): void
    {
        $admin = $this->userWithRole('admin');
        User::factory()->create([
            'email' => 'otra.persona@fonasin.test',
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', '1234567890'),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray([
                'document_number' => '1234567890',
            ]),
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1234567890',
                'full_name' => 'Persona Duplicada',
                'email' => 'persona.nueva@fonasin.test',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El correo indicado ya existe con un documento diferente.');
    }

    public function test_it_rejects_email_already_linked_to_another_associate(): void
    {
        $admin = $this->userWithRole('admin');
        $linkedUser = User::factory()->create(['email' => 'vinculado@fonasin.test']);
        $this->createAssociate(['user_id' => $linkedUser->id]);

        $this->actingAs($admin)
            ->postJson('/admin/associates', [
                'document_type' => 'CC',
                'document_number' => '1122334455',
                'full_name' => 'Persona Duplicada',
                'email' => 'vinculado@fonasin.test',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El correo indicado ya esta vinculado a otro asociado.');
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

    public function test_deactivating_associate_deactivates_user_and_revokes_sessions(): void
    {
        $admin = $this->userWithRole('admin');
        $user = User::factory()->create([
            'email' => 'asociado.activo@fonasin.test',
            'status' => 'active',
            'remember_token' => 'remember-token',
        ]);
        $associate = $this->createAssociate(['user_id' => $user->id]);

        DB::table('sessions')->insert([
            'id' => 'session-for-associated-user',
            'user_id' => $user->id,
            'payload' => 'synthetic-session',
            'last_activity' => now()->timestamp,
        ]);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => 'synthetic-token',
            'created_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson("/admin/associates/{$associate->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive')
            ->assertJsonPath('data.user.status', 'inactive');

        $user->refresh();
        $this->assertSame('inactive', $user->status);
        $this->assertNull($user->remember_token);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }

    private function createAssociate(array $overrides = []): Associate
    {
        $reference = (string) Str::uuid();

        return Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', $reference),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Test Person',
            'status' => 'active',
            ...$overrides,
        ]);
    }
}
