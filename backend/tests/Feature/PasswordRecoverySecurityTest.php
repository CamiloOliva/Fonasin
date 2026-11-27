<?php

namespace Tests\Feature;

use App\Application\Identity\UseCases\RequestPasswordReset;
use App\Application\Identity\UseCases\ResetPassword;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Mail\PasswordResetLinkMail;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PasswordRecoverySecurityTest extends TestCase
{
    use RefreshDatabase;

    public static function tokenAges(): array
    {
        return [
            'fresh' => [0, 200],
            'one hour old remains valid' => [3600, 200],
            'twelve hours old remains valid' => [43200, 200],
            'just before expiry' => [86399, 200],
            'exact expiry' => [86400, 422],
            'past expiry' => [86401, 422],
            'future timestamp' => [-60, 422],
        ];
    }

    #[DataProvider('tokenAges')]
    public function test_token_expiry_is_enforced_without_changing_password_on_failure(int $age, int $status): void
    {
        $this->freezeTime();
        $this->assertSame(1440, config('auth.passwords.users.expire'));
        $user = $this->account();
        $this->token($user, now()->subSeconds($age));
        $oldHash = $user->password;

        $this->postJson('/password/reset', $this->resetPayload($user))->assertStatus($status);
        $user->refresh();
        if ($status === 200) {
            $this->assertTrue(Hash::check('SyntheticNew123!', $user->password));
            $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
            $this->postJson('/password/reset', $this->resetPayload($user))->assertUnprocessable();
        } else {
            $this->assertSame($oldHash, $user->password);
            $this->assertDatabaseMissing('auth_events', ['event_type' => 'password_reset_completed']);
        }
    }

    public static function shortWindowAges(): array
    {
        return [[3599, 200], [3600, 422], [3601, 422]];
    }

    #[DataProvider('shortWindowAges')]
    public function test_returning_to_one_hour_uses_the_configured_expiry(int $age, int $status): void
    {
        config(['auth.passwords.users.expire' => 60]);
        $this->freezeTime();
        $user = $this->account();
        $this->token($user, now()->subSeconds($age));
        $this->postJson('/password/reset', $this->resetPayload($user))->assertStatus($status);
    }

    public function test_resending_after_twelve_hours_invalidates_previous_link_and_starts_a_new_window(): void
    {
        Mail::fake();
        $this->freezeTime();
        $user = $this->account();
        $user->forceFill(['document_number_hash' => app(HashesSensitiveData::class)->documentNumber('1234567890')])->save();
        $send = app(RequestPasswordReset::class);
        $send($user->email, '1234567890');
        $first = Mail::sent(PasswordResetLinkMail::class)->first();
        parse_str(parse_url($first->resetUrl, PHP_URL_QUERY), $firstQuery);
        $this->travel(12)->hours();
        $send($user->email, '1234567890');
        $second = Mail::sent(PasswordResetLinkMail::class)->last();
        parse_str(parse_url($second->resetUrl, PHP_URL_QUERY), $secondQuery);
        $this->assertSame(1440, $second->expiresInMinutes);
        $this->assertNotSame($firstQuery['token'], $secondQuery['token']);
        $this->postJson('/password/reset', [...$this->resetPayload($user), 'token' => $firstQuery['token']])->assertUnprocessable();
        $this->postJson('/password/reset', [...$this->resetPayload($user), 'token' => $secondQuery['token']])->assertOk();
    }

    public function test_reset_revokes_database_sessions_and_remember_token_but_not_other_accounts(): void
    {
        $user = $this->account();
        $other = $this->account('other-security@example.test');
        $this->token($user, now());
        foreach (['first-device', 'second-device'] as $id) {
            DB::table('sessions')->insert(['id' => $id, 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        }
        DB::table('sessions')->insert(['id' => 'other-device', 'user_id' => $other->id, 'payload' => '', 'last_activity' => time()]);

        $this->postJson('/password/reset', $this->resetPayload($user))->assertOk();

        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->id)->count());
        $this->assertDatabaseHas('sessions', ['id' => 'other-device', 'user_id' => $other->id]);
        $this->assertNotSame('synthetic-remember', $user->refresh()->remember_token);
        $this->assertSame('synthetic-remember', $other->refresh()->remember_token);
        $this->assertDatabaseHas('auth_events', ['user_id' => $user->id, 'event_type' => 'password_reset_completed', 'metadata->sessions_revoked' => true]);
    }

    public function test_existing_session_cannot_reenter_admin_after_password_recovery(): void
    {
        $user = $this->account();
        $user->roles()->attach(Role::query()->create(['name' => 'admin']));
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticOld123!'])->assertOk();
        $this->getJson('/admin/import-batches')->assertOk();
        $this->token($user, now());
        $this->postJson('/password/reset', $this->resetPayload($user))->assertOk();
        Auth::forgetGuards();

        $this->getJson('/admin/import-batches')->assertUnauthorized();
        $this->getJson('/auth/user')->assertUnauthorized();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticOld123!'])->assertUnprocessable();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticNew123!'])->assertOk();
        $this->getJson('/admin/import-batches')->assertOk();
    }

    public function test_login_binds_the_password_before_the_first_private_request(): void
    {
        $user = $this->account();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticOld123!'])->assertOk();
        $this->assertSame(Auth::guard('web')->hashPasswordForCookie($user->getAuthPassword()), $this->app['session']->get('password_hash_web'));
        $this->assertNotSame($user->password, $this->app['session']->get('password_hash_web'));
    }

    public function test_changed_password_invalidates_a_session_resaved_by_a_racing_request(): void
    {
        $user = $this->account();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticOld123!'])->assertOk();
        $this->getJson('/auth/user')->assertOk();
        // Model a session written back by an in-flight request after DB deletion.
        $this->token($user, now());
        app(ResetPassword::class)($user->email, 'synthetic-token', 'SyntheticNew123!');
        Auth::forgetGuards();

        $this->getJson('/auth/user')->assertUnauthorized();
    }

    public function test_invalid_token_does_not_revoke_valid_sessions(): void
    {
        $user = $this->account();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'SyntheticOld123!'])->assertOk();
        $this->token($user, now());
        $this->postJson('/password/reset', [...$this->resetPayload($user), 'token' => 'wrong'])->assertUnprocessable();
        Auth::forgetGuards();
        $this->getJson('/auth/user')->assertOk();
        $this->assertSame('synthetic-remember', $user->refresh()->remember_token);
    }

    public function test_reset_limits_account_attempts_even_when_ip_changes_and_recovers_after_window(): void
    {
        $this->freezeTime();
        $user = $this->account();
        $this->token($user, now());
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.$i])
                ->postJson('/password/reset', [...$this->resetPayload($user), 'email' => strtoupper($user->email), 'token' => 'wrong'])
                ->assertUnprocessable();
        }
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.99'])
            ->postJson('/password/reset', $this->resetPayload($user))->assertTooManyRequests()->assertHeader('Retry-After');
        $this->assertTrue(Hash::check('SyntheticOld123!', $user->refresh()->password));
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
        $this->travel(61)->seconds();
        $this->postJson('/password/reset', $this->resetPayload($user))->assertOk();
    }

    public function test_reset_limits_ip_attempts_even_when_email_changes_and_does_not_block_other_ip(): void
    {
        $user = $this->account();
        for ($i = 1; $i <= 10; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.1'])
                ->postJson('/password/reset', [...$this->resetPayload($user), 'email' => "synthetic-{$i}@example.test"])
                ->assertUnprocessable();
        }
        $this->postJson('/password/reset', $this->resetPayload($user))->assertTooManyRequests();
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.2'])
            ->postJson('/password/reset', $this->resetPayload($user))->assertUnprocessable();
    }

    private function account(string $email = 'security-audit@example.test', array $roles = ['associate']): User
    {
        $user = User::factory()->create(['email' => $email, 'password' => 'SyntheticOld123!', 'status' => 'active',
            'must_change_password' => false, 'remember_token' => 'synthetic-remember']);
        foreach ($roles as $role) {
            $user->roles()->attach(Role::firstOrCreate(['name' => $role]));
        }

        return $user;
    }

    public static function roleWindows(): array
    {
        return [
            'associate before 24h' => [['associate'], 86399, 200, 1440],
            'associate at 24h' => [['associate'], 86400, 422, 1440],
            'admin before 2h' => [['admin'], 7199, 200, 120],
            'admin at 2h' => [['admin'], 7200, 422, 120],
            'reviewer before 2h' => [['reviewer'], 7199, 200, 120],
            'reviewer at 2h' => [['reviewer'], 7200, 422, 120],
            'mixed roles at 2h' => [['associate', 'admin'], 7200, 422, 120],
            'unclassified account at 2h' => [[], 7200, 422, 120],
        ];
    }

    #[DataProvider('roleWindows')]
    public function test_role_specific_expiry_and_recovery_mail_agree(array $roles, int $age, int $status, int $minutes): void
    {
        Mail::fake();
        $this->freezeTime();
        $user = $this->account(roles: $roles);
        $user->forceFill(['document_number_hash' => app(HashesSensitiveData::class)->documentNumber('1234567890')])->save();
        app(RequestPasswordReset::class)($user->email, '1234567890');
        Mail::assertSent(PasswordResetLinkMail::class, fn ($mail) => $mail->expiresInMinutes === $minutes);
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
        $this->token($user, now()->subSeconds($age));
        $this->postJson('/password/reset', $this->resetPayload($user))->assertStatus($status);
    }

    public function test_malformed_email_is_a_validation_error_not_a_throttle_exception(): void
    {
        $user = $this->account();
        $this->postJson('/password/reset', [...$this->resetPayload($user), 'email' => ['unexpected']])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    private function token(User $user, \DateTimeInterface $createdAt): void
    {
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => Hash::make('synthetic-token'), 'created_at' => $createdAt]);
    }

    private function resetPayload(User $user): array
    {
        return ['email' => $user->email, 'token' => 'synthetic-token', 'password' => 'SyntheticNew123!', 'password_confirmation' => 'SyntheticNew123!'];
    }
}
