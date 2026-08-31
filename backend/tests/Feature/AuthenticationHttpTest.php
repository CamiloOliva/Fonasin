<?php

namespace Tests\Feature;

use App\Domain\Identity\Enums\AuthEventType;
use App\Models\AuthEvent;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_auth_event_is_recorded(): void
    {
        $user = User::factory()->create([
            'email' => 'reviewer@example.test',
            'password' => Hash::make('correct-password'),
            'status' => 'active',
        ]);
        $role = Role::query()->create(['name' => 'reviewer']);
        $user->roles()->attach($role);

        $response = $this->postJson('/login', [
            'email' => 'reviewer@example.test',
            'password' => 'correct-password',
        ], [
            'User-Agent' => 'Feature Test Browser',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.roles.0', 'reviewer')
            ->assertJsonPath('data.must_change_password', false)
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->refresh()->last_login_at);
        $this->assertDatabaseHas('auth_events', [
            'user_id' => $user->id,
            'event_type' => AuthEventType::LoginSucceeded->value,
        ]);
    }

    public function test_authenticated_user_can_read_current_session_payload(): void
    {
        $user = User::factory()->create([
            'email' => 'associate@example.test',
            'status' => 'active',
        ]);
        $role = Role::query()->create(['name' => 'associate']);
        $user->roles()->attach($role);

        $this->actingAs($user)
            ->getJson('/auth/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'associate@example.test')
            ->assertJsonPath('data.roles.0', 'associate')
            ->assertJsonPath('data.must_change_password', false)
            ->assertJsonMissingPath('data.password');
    }

    public function test_guest_cannot_read_current_session_payload(): void
    {
        $this->getJson('/auth/user')->assertUnauthorized();
    }

    public function test_failed_login_records_redacted_auth_event(): void
    {
        User::factory()->create([
            'email' => 'associate@example.test',
            'password' => Hash::make('correct-password'),
            'status' => 'active',
        ]);

        $this->postJson('/login', [
            'email' => 'associate@example.test',
            'password' => 'wrong-password',
        ])->assertUnprocessable();

        $this->assertGuest();

        $event = AuthEvent::query()
            ->where('event_type', AuthEventType::LoginFailed->value)
            ->firstOrFail();

        $this->assertNull($event->user_id);
        $this->assertSame(['reason' => 'invalid_credentials'], $event->metadata);
        $this->assertArrayNotHasKey('email_hash', $event->toArray());
        $this->assertArrayNotHasKey('ip_hash', $event->toArray());
        $this->assertStringNotContainsString('associate@example.test', json_encode($event->metadata, JSON_THROW_ON_ERROR));
    }

    public function test_inactive_user_cannot_login_and_is_audited(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.test',
            'password' => Hash::make('correct-password'),
            'status' => 'inactive',
        ]);

        $this->postJson('/login', [
            'email' => 'inactive@example.test',
            'password' => 'correct-password',
        ])->assertForbidden();

        $this->assertGuest();
        $this->assertDatabaseHas('auth_events', [
            'user_id' => $user->id,
            'event_type' => AuthEventType::LoginFailed->value,
        ]);
    }

    public function test_login_is_rate_limited_after_repeated_failures(): void
    {
        User::factory()->create([
            'email' => 'limited@example.test',
            'password' => Hash::make('correct-password'),
            'status' => 'active',
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/login', [
                'email' => 'limited@example.test',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/login', [
            'email' => 'limited@example.test',
            'password' => 'wrong-password',
        ])->assertStatus(429);

        $this->assertDatabaseHas('auth_events', [
            'event_type' => AuthEventType::LoginFailed->value,
            'metadata->reason' => 'rate_limited',
        ]);
    }

    public function test_user_can_logout_and_auth_event_is_recorded(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/logout');

        $response->assertOk()
            ->assertJsonPath('message', 'Logged out.');

        $this->assertGuest();
        $this->assertDatabaseHas('auth_events', [
            'user_id' => $user->id,
            'event_type' => AuthEventType::Logout->value,
        ]);
    }

    public function test_user_with_temporary_password_must_change_it_before_accessing_private_routes(): void
    {
        $user = User::factory()->create([
            'email' => 'temporary@example.test',
            'password' => Hash::make('temporary-123'),
            'status' => 'active',
            'must_change_password' => true,
        ]);
        $role = Role::query()->create(['name' => 'associate']);
        $user->roles()->attach($role);

        $this->actingAs($user)
            ->getJson('/portal/credits')
            ->assertStatus(423)
            ->assertJsonPath('message', 'Password change is required before continuing.');
    }

    public function test_user_can_change_required_temporary_password(): void
    {
        $user = User::factory()->create([
            'email' => 'temporary@example.test',
            'password' => Hash::make('temporary-123'),
            'status' => 'active',
            'must_change_password' => true,
        ]);
        $role = Role::query()->create(['name' => 'associate']);
        $user->roles()->attach($role);

        $response = $this->actingAs($user)
            ->postJson('/auth/password', [
                'current_password' => 'temporary-123',
                'password' => 'NuevaClave123',
                'password_confirmation' => 'NuevaClave123',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.must_change_password', false)
            ->assertJsonMissingPath('data.password');

        $this->assertFalse($user->refresh()->must_change_password);
        $this->assertTrue(Hash::check('NuevaClave123', $user->password));
        $this->assertDatabaseHas('auth_events', [
            'user_id' => $user->id,
            'event_type' => AuthEventType::PasswordChanged->value,
        ]);
    }

    public function test_current_password_is_required_to_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('temporary-123'),
            'status' => 'active',
            'must_change_password' => true,
        ]);

        $this->actingAs($user)
            ->postJson('/auth/password', [
                'current_password' => 'wrong-password',
                'password' => 'NuevaClave123',
                'password_confirmation' => 'NuevaClave123',
            ])
            ->assertUnprocessable();

        $this->assertTrue($user->refresh()->must_change_password);
    }
}
