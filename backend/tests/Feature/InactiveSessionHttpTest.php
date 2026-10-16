<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class InactiveSessionHttpTest extends TestCase
{
    use RefreshDatabase;

    public static function protectedRequests(): array
    {
        return [
            'admin read' => ['admin', 'GET', '/admin/import-batches'],
            'admin write' => ['admin', 'POST', '/admin/credits'],
            'reviewer read' => ['reviewer', 'GET', '/admin/affiliation-applications'],
            'associate read' => ['associate', 'GET', '/portal/account-statement'],
            'session payload' => ['associate', 'GET', '/auth/user'],
            'password change' => ['associate', 'POST', '/auth/password'],
        ];
    }

    #[DataProvider('protectedRequests')]
    public function test_deactivated_account_loses_its_existing_session(string $role, string $method, string $path): void
    {
        $user = User::factory()->create(['status' => 'active', 'password' => 'SyntheticPassword123!', 'must_change_password' => false]);
        $user->roles()->attach(Role::query()->firstOrCreate(['name' => $role]));
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticPassword123!'])->assertOk();
        $oldSession = $this->app['session']->getId();
        $this->app['session']->put('private_marker', 'synthetic');
        User::query()->whereKey($user->id)->update(['status' => 'inactive']);
        // Reload the principal as a real next HTTP request does.
        Auth::forgetGuards();

        $this->json($method, $path)->assertForbidden()->assertJsonPath('message', 'User account is inactive.');
        $this->assertGuest();
        $this->assertNotSame($oldSession, $this->app['session']->getId());
        $this->assertNull($this->app['session']->get('private_marker'));
        $this->assertDatabaseCount('credit_accounts', 0);
        $this->assertDatabaseHas('auth_events', ['user_id' => $user->id, 'event_type' => 'logout', 'metadata->reason' => 'inactive_session']);
        $this->getJson('/auth/user')->assertUnauthorized();
    }

    public function test_active_sessions_and_public_guest_routes_remain_available(): void
    {
        $this->getJson('/csrf-token')->assertOk();
        $user = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $this->actingAs($user)->getJson('/auth/user')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseMissing('auth_events', ['event_type' => 'logout']);
    }
}
