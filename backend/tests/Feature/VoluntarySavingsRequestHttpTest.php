<?php

namespace Tests\Feature;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsAuthorization;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VoluntarySavingsRequestHttpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->app->instance(RendersVoluntarySavingsAuthorization::class, new class implements RendersVoluntarySavingsAuthorization
        {
            public function render(array $data): string
            {
                return '%PDF-1.4 voluntary savings authorization';
            }
        });
    }

    public function test_guest_cannot_use_voluntary_savings_requests(): void
    {
        $this->getJson('/portal/voluntary-savings-requests')->assertUnauthorized();
        $this->postJson('/portal/voluntary-savings-requests', [])->assertUnauthorized();
        $this->getJson('/admin/voluntary-savings-requests')->assertUnauthorized();
    }

    public function test_active_associate_can_submit_and_view_private_authorization(): void
    {
        [$user, $associate] = $this->associateUser();

        $response = $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '150000.00',
            'accept_terms' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.monthly_amount', '150000.00')
            ->assertJsonPath('data.status', 'submitted');

        $request = VoluntarySavingsRequest::query()->firstOrFail();
        $this->assertSame($associate->id, $request->associate_id);
        Storage::disk('local')->assertExists((string) $request->getAttribute('authorization_storage_key'));

        $this->actingAs($user)
            ->getJson('/portal/voluntary-savings-requests')
            ->assertOk()
            ->assertJsonPath('data.0.id', $request->id);

        $this->actingAs($user)
            ->get("/portal/voluntary-savings-requests/{$request->id}/authorization")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsRequested->value,
            'subject_id' => $request->id,
        ]);
    }

    public function test_associate_cannot_submit_duplicate_pending_request_or_view_another_authorization(): void
    {
        [$user] = $this->associateUser();
        [$otherUser] = $this->associateUser('other@example.test');

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '100000',
            'accept_terms' => true,
        ])->assertCreated();

        $request = VoluntarySavingsRequest::query()->firstOrFail();

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '200000',
            'accept_terms' => true,
        ])->assertUnprocessable();

        $this->actingAs($otherUser)
            ->get("/portal/voluntary-savings-requests/{$request->id}/authorization")
            ->assertForbidden();
    }

    public function test_admin_can_review_request_and_reviewer_is_read_only(): void
    {
        [$associateUser] = $this->associateUser();
        $this->actingAs($associateUser)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '250000',
            'accept_terms' => true,
        ])->assertCreated();
        $request = VoluntarySavingsRequest::query()->firstOrFail();
        $reviewer = $this->userWithRole('reviewer');
        $admin = $this->userWithRole('admin');

        $this->actingAs($reviewer)
            ->getJson('/admin/voluntary-savings-requests')
            ->assertOk()
            ->assertJsonPath('data.0.id', $request->id);

        $this->actingAs($reviewer)
            ->patchJson("/admin/voluntary-savings-requests/{$request->id}", ['status' => 'approved'])
            ->assertForbidden();

        $this->actingAs($admin)
            ->patchJson("/admin/voluntary-savings-requests/{$request->id}", [
                'status' => 'approved',
                'notes' => 'Validada para tramite.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('voluntary_savings_requests', [
            'id' => $request->id,
            'status' => 'approved',
            'reviewed_by_user_id' => $admin->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsRequestReviewed->value,
            'subject_id' => $request->id,
        ]);
    }

    /** @return array{User, Associate} */
    private function associateUser(string $email = 'associate@example.test'): array
    {
        $user = User::factory()->create(['email' => $email, 'must_change_password' => false]);
        $role = Role::query()->firstOrCreate(['name' => 'associate']);
        $user->roles()->attach($role);
        $document = fake()->unique()->numerify('##########');
        $associate = Associate::query()->create([
            'user_id' => $user->id,
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', $document),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => $document]),
            'full_name' => 'Synthetic Associate',
            'status' => 'active',
        ]);

        return [$user, $associate];
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
