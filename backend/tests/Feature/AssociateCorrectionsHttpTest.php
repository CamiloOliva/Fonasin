<?php

namespace Tests\Feature;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Mail\AssociateActivationMail;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class AssociateCorrectionsHttpTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $role): User
    {
        $user = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $user->roles()->attach(Role::firstOrCreate(['name' => $role]));

        return $user;
    }

    private function associate(): Associate
    {
        $user = $this->actor('associate');

        return Associate::create([
            'user_id' => $user->id, 'full_name' => 'Persona Sintetica', 'document_type' => 'CC',
            'document_number_hash' => hash('sha256', (string) Str::uuid()),
            'document_number_encrypted' => 'synthetic-ciphertext', 'status' => 'active',
            'legacy_validation_required' => false,
        ]);
    }

    private function payload(Associate $associate): array
    {
        return ['email' => 'corregido@example.test', 'email_confirmation' => 'corregido@example.test', 'expected_email' => $associate->user->email];
    }

    public function test_correction_revokes_access_preserves_record_and_requires_activation_then_new_link(): void
    {
        Mail::fake();
        $admin = $this->actor('admin');
        $associate = $this->associate();
        $user = $associate->user;
        $oldEmail = $user->email;
        $oldPassword = $user->password;
        DB::table('sessions')->insert(['id' => 'synthetic-session', 'user_id' => $user->id, 'payload' => 'test', 'last_activity' => now()->timestamp]);
        DB::table('password_reset_tokens')->insert(['email' => $oldEmail, 'token' => 'synthetic-token', 'created_at' => now()]);
        $this->actingAs($admin)->postJson("/admin/associates/{$associate->id}/email", $this->payload($associate))
            ->assertOk()->assertJsonPath('data.id', $associate->id)->assertJsonPath('data.user.email', 'corregido@example.test')
            ->assertJsonPath('data.status', 'inactive')->assertJsonPath('data.activation_required', true);
        $this->assertSame('inactive', $user->refresh()->status);
        $this->assertNotSame($oldPassword, $user->password);
        $this->assertFalse(Hash::check('password', $user->password));
        $this->assertNull($user->email_verified_at);
        $this->assertNull($user->remember_token);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $oldEmail]);
        $this->assertSame('Persona Sintetica', $associate->refresh()->full_name);
        $this->assertDatabaseCount('associates', 1);
        $event = DB::table('audit_events')->where('action', 'user.email_corrected')->first();
        $this->assertSame($admin->id, $event->actor_user_id);
        $this->assertNotNull($event->correlation_id);
        $this->assertStringNotContainsString($oldEmail, $event->metadata);
        $this->assertStringNotContainsString('corregido@example.test', $event->metadata);
        Mail::assertNothingSent();
        $this->postJson("/admin/associates/{$associate->id}/activation")->assertUnprocessable();
        $this->postJson("/admin/associates/{$associate->id}/activate")->assertOk();
        $this->postJson("/admin/associates/{$associate->id}/activation")->assertOk();
        Mail::assertSent(AssociateActivationMail::class, fn ($mail) => $mail->hasTo('corregido@example.test') && $mail->expiresInMinutes === 1440 && str_contains($mail->render(), '24 horas'));
    }

    public function test_guest_reviewer_and_associate_cannot_correct_email(): void
    {
        $associate = $this->associate();
        $url = "/admin/associates/{$associate->id}/email";
        $this->postJson($url, $this->payload($associate))->assertUnauthorized();
        foreach (['reviewer', 'associate'] as $role) {
            $this->actingAs($this->actor($role))->postJson($url, $this->payload($associate))->assertForbidden();
        }
        $this->assertSame('active', $associate->refresh()->status);
    }

    public function test_duplicate_invalid_mismatch_and_stale_email_leave_account_unchanged(): void
    {
        $admin = $this->actor('admin');
        $associate = $this->associate();
        $oldEmail = $associate->user->email;
        User::factory()->create(['email' => 'ocupado@example.test']);
        foreach ([
            ['email' => 'ocupado@example.test', 'email_confirmation' => 'ocupado@example.test'],
            ['email' => 'no-es-correo'],
            ['email_confirmation' => 'otro@example.test'],
            ['expected_email' => 'desactualizado@example.test'],
            ['email' => $oldEmail, 'email_confirmation' => $oldEmail],
        ] as $change) {
            $this->actingAs($admin)->postJson("/admin/associates/{$associate->id}/email", [...$this->payload($associate), ...$change])->assertUnprocessable();
            $this->assertSame($oldEmail, $associate->user->refresh()->email);
            $this->assertSame('active', $associate->refresh()->status);
        }
        $this->assertDatabaseMissing('audit_events', ['action' => 'user.email_corrected']);
    }

    public function test_correction_cannot_change_backoffice_account_or_missing_link(): void
    {
        $admin = $this->actor('admin');
        $associate = $this->associate();
        $associate->user->roles()->attach(Role::firstOrCreate(['name' => 'reviewer']));
        $payload = $this->payload($associate);
        $this->actingAs($admin)->postJson("/admin/associates/{$associate->id}/email", $payload)->assertUnprocessable();
        $associate->forceFill(['user_id' => null])->save();
        $this->postJson("/admin/associates/{$associate->id}/email", $payload)->assertUnprocessable();
    }

    public function test_email_normalization_and_double_submission_do_not_overwrite_twice(): void
    {
        $admin = $this->actor('admin');
        $associate = $this->associate();
        $payload = [...$this->payload($associate), 'email' => ' Corregido@EXAMPLE.test ', 'email_confirmation' => 'corregido@example.test'];
        $this->actingAs($admin)->postJson("/admin/associates/{$associate->id}/email", $payload)->assertOk()->assertJsonPath('data.user.email', 'corregido@example.test');
        $this->postJson("/admin/associates/{$associate->id}/email", $payload)->assertUnprocessable();
        $this->assertSame(1, DB::table('audit_events')->where('action', 'user.email_corrected')->count());
    }

    public function test_audit_failure_rolls_back_email_status_and_revoked_links(): void
    {
        $admin = $this->actor('admin');
        $associate = $this->associate();
        $oldEmail = $associate->user->email;
        DB::table('password_reset_tokens')->insert(['email' => $oldEmail, 'token' => 'synthetic', 'created_at' => now()]);
        $this->mock(RecordAuditEvent::class)->shouldReceive('__invoke')->andThrow(new RuntimeException('Synthetic audit failure'));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->postJson("/admin/associates/{$associate->id}/email", $this->payload($associate));
            $this->fail('Expected audit failure');
        } catch (RuntimeException $exception) {
            $this->assertSame('Synthetic audit failure', $exception->getMessage());
        }
        $this->assertSame($oldEmail, $associate->user->refresh()->email);
        $this->assertSame('active', $associate->refresh()->status);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $oldEmail]);
    }

    public function test_admin_can_add_missing_identity_support_to_existing_active_exempt_record_without_changing_access(): void
    {
        Storage::fake('local');
        $associate = $this->associate();
        $admin = $this->actor('admin');
        $url = "/admin/associates/{$associate->id}/identity-support";
        $this->actingAs($this->actor('reviewer'))->postJson($url, ['file' => UploadedFile::fake()->create('cedula.pdf', 32, 'application/pdf')])->assertForbidden();
        $this->actingAs($admin)->postJson($url, ['file' => UploadedFile::fake()->create('cedula.pdf', 32, 'application/pdf')])
            ->assertOk()->assertJsonPath('data.has_identity_support', true)->assertJsonPath('data.status', 'active');
        $key = $associate->refresh()->identity_support_storage_key;
        Storage::disk('local')->assertExists($key);
        $this->assertSame('active', $associate->user->status);
        $this->assertFalse($associate->legacy_validation_required);
        $this->postJson($url, ['file' => UploadedFile::fake()->create('otra.pdf', 32, 'application/pdf')])->assertUnprocessable();
        $this->assertSame($key, $associate->refresh()->identity_support_storage_key);
    }

    public function test_listing_can_reach_records_beyond_fifty_with_stable_page_order(): void
    {
        $admin = $this->actor('admin');
        for ($i = 0; $i < 51; $i++) {
            Associate::create(['full_name' => 'Persona Sintetica '.$i, 'document_type' => 'CC', 'document_number_hash' => hash('sha256', (string) $i), 'document_number_encrypted' => 'test', 'status' => 'active']);
        }
        $first = $this->actingAs($admin)->getJson('/admin/associates?page=1')->assertOk()->assertJsonCount(50, 'data')->assertJsonPath('meta.total', 51)->assertJsonPath('meta.last_page', 2)->json('data');
        $last = $this->getJson('/admin/associates?page=2')->assertOk()->assertJsonCount(1, 'data')->json('data');
        $this->assertCount(51, array_unique(array_column([...$first, ...$last], 'id')));
    }

    public function test_document_search_can_filter_the_list_to_a_record_outside_the_first_page(): void
    {
        $admin = $this->actor('admin');
        $target = $this->associate();
        $target->forceFill([
            'created_at' => now()->subYear(),
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('1234567890'),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => '1234567890']),
        ])->save();
        for ($i = 0; $i < 51; $i++) {
            Associate::create(['full_name' => 'Otra Persona '.$i, 'document_type' => 'CC', 'document_number_hash' => hash('sha256', (string) $i), 'document_number_encrypted' => 'test', 'status' => 'active']);
        }
        $this->actingAs($admin)->getJson('/admin/associates')->assertJsonMissing(['id' => $target->id]);
        $this->postJson('/admin/associates/profile/search', ['document_number' => '1234567890'])
            ->assertOk()->assertJsonPath('data.associate.id', $target->id);
        $this->getJson('/admin/associates?associate_id='.$target->id)
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $target->id)
            ->assertJsonPath('meta.total', 1)->assertJsonPath('meta.last_page', 1);
        $this->getJson('/admin/associates')->assertOk()->assertJsonPath('meta.total', 52);
    }

    public function test_associate_id_filter_rejects_invalid_ids_and_returns_empty_for_unknown_id(): void
    {
        $this->actingAs($this->actor('admin'));
        $this->getJson('/admin/associates?associate_id=invalid')->assertUnprocessable();
        $this->getJson('/admin/associates?associate_id='.(string) Str::uuid())
            ->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }
}
