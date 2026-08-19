<?php

namespace Tests\Feature;

use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IdentityModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_roles_and_associates_generate_uuid_primary_keys(): void
    {
        $role = Role::query()->create(['name' => 'test-role']);
        $associate = Associate::query()->create($this->associateAttributes());

        $this->assertTrue(Str::isUuid($role->id));
        $this->assertTrue(Str::isUuid($associate->id));
    }

    public function test_user_and_role_relationship_is_bidirectional(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'reviewer']);

        $user->roles()->attach($role);

        $this->assertTrue($user->roles->contains($role));
        $this->assertTrue($role->users->contains($user));
        $this->assertNotNull($user->roles->first()->pivot->created_at);
    }

    public function test_user_can_check_roles(): void
    {
        $user = User::factory()->create();
        $reviewer = Role::query()->create(['name' => 'reviewer']);

        $user->roles()->attach($reviewer);
        $user->load('roles');

        $this->assertTrue($user->hasRole('reviewer'));
        $this->assertTrue($user->hasAnyRole(['admin', 'reviewer']));
        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_user_and_associate_relationship_is_bidirectional(): void
    {
        $user = User::factory()->create();
        $associate = Associate::query()->create([
            ...$this->associateAttributes(),
            'user_id' => $user->id,
        ]);

        $this->assertTrue($user->associate->is($associate));
        $this->assertTrue($associate->user->is($user));
    }

    public function test_sensitive_identity_fields_are_hidden_from_serialization(): void
    {
        $user = User::factory()->create();
        $associate = Associate::query()->create([
            ...$this->associateAttributes(),
            'user_id' => $user->id,
        ]);

        $this->assertArrayNotHasKey('password', $user->toArray());
        $this->assertArrayNotHasKey('remember_token', $user->toArray());
        $this->assertArrayNotHasKey('document_number_hash', $associate->toArray());
        $this->assertArrayNotHasKey('document_number_encrypted', $associate->toArray());
    }

    public function test_role_seeder_is_idempotent(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(RoleSeeder::class);

        $this->assertDatabaseCount('roles', 3);
        $this->assertEqualsCanonicalizing(
            ['admin', 'reviewer', 'associate'],
            Role::query()->pluck('name')->all()
        );
    }

    /**
     * @return array<string, string>
     */
    private function associateAttributes(): array
    {
        $reference = (string) Str::uuid();

        return [
            'document_type' => 'test',
            'document_number_hash' => hash('sha256', $reference),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Test Person',
            'status' => 'applicant',
        ];
    }
}
