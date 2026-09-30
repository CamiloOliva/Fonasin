<?php

namespace Tests\Feature;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsPayrollAuthorization;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Contributions\Enums\ContributionAuditAction;
use App\Models\Associate;
use App\Models\AuditEvent;
use App\Models\Role;
use App\Models\User;
use App\Models\VoluntarySavingsRequest;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class VoluntarySavingsRequestHttpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->app->instance(RendersVoluntarySavingsPayrollAuthorization::class, new class implements RendersVoluntarySavingsPayrollAuthorization
        {
            public function render(array $data): string
            {
                return '%PDF-1.4 payroll authorization';
            }
        });
    }

    public function test_guest_cannot_use_voluntary_savings_requests(): void
    {
        $this->getJson('/portal/voluntary-savings-requests')->assertUnauthorized();
        $this->postJson('/portal/voluntary-savings-requests', [])->assertUnauthorized();
        $this->getJson('/admin/voluntary-savings-requests')->assertUnauthorized();
    }

    public function test_active_associate_can_submit_and_view_request(): void
    {
        [$user, $associate] = $this->associateUser();

        $response = $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '150000',
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
            ->assertJsonPath('data.0.id', $request->id)
            ->assertJsonPath('data.0.links.payroll_authorization_preview', "/portal/voluntary-savings-requests/{$request->id}/payroll-authorization/preview")
            ->assertJsonMissingPath('data.0.authorization_storage_key');

        $this->actingAs($user)
            ->get("/admin/voluntary-savings-requests/{$request->id}/payroll-authorization/preview")
            ->assertForbidden();

        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsRequested->value,
            'subject_id' => $request->id,
        ]);
    }

    public function test_associate_cannot_submit_duplicate_pending_request(): void
    {
        [$user] = $this->associateUser();
        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '100000',
            'accept_terms' => true,
        ])->assertCreated();

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '200000',
            'accept_terms' => true,
        ])->assertUnprocessable();
    }

    public function test_storage_failure_rolls_back_request_and_audit_event(): void
    {
        [$user] = $this->associateUser();
        $this->app->instance(StoresPrivateFiles::class, new class implements StoresPrivateFiles
        {
            public function put(string $storageKey, string $contents): void
            {
                throw new \RuntimeException('Storage unavailable.');
            }
        });

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '100000',
            'accept_terms' => true,
        ])->assertServerError();

        $this->assertDatabaseCount('voluntary_savings_requests', 0);
        $this->assertDatabaseMissing('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsRequested->value,
        ]);
    }

    public function test_database_constraint_closes_the_concurrent_pending_request_race(): void
    {
        [$user, $associate] = $this->associateUser();
        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '100000',
            'accept_terms' => true,
        ])->assertCreated();

        $this->expectException(QueryException::class);
        VoluntarySavingsRequest::query()->forceCreate([
            'id' => (string) Str::uuid(),
            'associate_id' => $associate->id,
            'pending_associate_id' => $associate->id,
            'monthly_amount' => 200000,
            'status' => 'submitted',
            'authorization_storage_key' => 'private/test.pdf',
            'submitted_at' => now(),
        ]);
    }

    public function test_monthly_amount_must_be_integer_and_within_limit(): void
    {
        [$user] = $this->associateUser();

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '1000.50',
            'accept_terms' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('monthly_amount');

        $this->actingAs($user)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => '10000000001',
            'accept_terms' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('monthly_amount');
    }

    public function test_payroll_authorization_is_complete_without_mandatory_contribution(): void
    {
        $html = view('pdf.contributions.voluntary-savings-payroll-authorization', [
            'requestId' => 'request-test',
            'fullName' => 'Synthetic Associate',
            'documentType' => 'CC',
            'documentNumber' => '123456789',
            'issuePlace' => 'Bucaramanga',
            'employer' => 'Empresa de prueba',
            'phone' => '3000000000',
            'email' => 'associate@example.test',
            'monthlySalary' => 2500000,
            'voluntarySavings' => 150000,
            'totalMonthlyDeduction' => 150000,
            'city' => 'Bucaramanga',
            'signatureDateLabel' => '23 de septiembre de 2026',
            'acceptedAt' => '2026-09-23 20:00:00',
            'verificationCode' => 'ABC123',
            'logoDataUri' => null,
        ])->render();
        $plainText = html_entity_decode(strip_tags($html));

        $this->assertStringContainsString('Datos del solicitante', $plainText);
        $this->assertStringContainsString('Tratamiento de datos', $plainText);
        $this->assertStringContainsString('Ahorro voluntario', $plainText);
        $this->assertStringContainsString('$ 150.000', $plainText);
        $this->assertStringNotContainsString('Aporte obligatorio', $plainText);
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

        $secondAdmin = $this->userWithRole('admin');
        $this->actingAs($secondAdmin)
            ->patchJson("/admin/voluntary-savings-requests/{$request->id}", [
                'status' => 'rejected',
                'notes' => 'Decision simultanea tardia.',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'La solicitud de ahorro voluntario ya fue revisada.');

        $this->actingAs($admin)
            ->post("/admin/voluntary-savings-requests/{$request->id}/signed-authorization", [
                'file' => UploadedFile::fake()->create('libranza-firmada.pdf', 120, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.links.signed_authorization_preview', "/admin/voluntary-savings-requests/{$request->id}/signed-authorization/preview");

        $request->refresh();
        Storage::disk('local')->assertExists((string) $request->getAttribute('signed_authorization_storage_key'));

        $this->actingAs($admin)
            ->post("/admin/voluntary-savings-requests/{$request->id}/signed-authorization", [
                'file' => UploadedFile::fake()->create('otra-libranza.pdf', 120, 'application/pdf'),
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'La solicitud ya tiene una libranza firmada registrada.');

        $adminResponse = $this->actingAs($admin)->getJson('/admin/voluntary-savings-requests');
        $adminResponse->assertOk()
            ->assertJsonPath('data.0.links.payroll_authorization_preview', "/admin/voluntary-savings-requests/{$request->id}/payroll-authorization/preview")
            ->assertJsonMissingPath('data.0.authorization_storage_key');

        $this->actingAs($admin)
            ->get("/admin/voluntary-savings-requests/{$request->id}/payroll-authorization/preview")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->actingAs($admin)
            ->get("/admin/voluntary-savings-requests/{$request->id}/payroll-authorization/download")
            ->assertOk()
            ->assertDownload("libranza-ahorro-voluntario-{$request->id}.pdf");

        $this->actingAs($admin)
            ->get("/admin/voluntary-savings-requests/{$request->id}/signed-authorization/preview")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->actingAs($admin)
            ->get("/admin/voluntary-savings-requests/{$request->id}/signed-authorization/download")
            ->assertOk()
            ->assertDownload("libranza-ahorro-voluntario-firmada-{$request->id}.pdf");

        $this->assertDatabaseHas('voluntary_savings_requests', [
            'id' => $request->id,
            'status' => 'approved',
            'pending_associate_id' => null,
            'reviewed_by_user_id' => $admin->id,
        ]);
        $this->assertSame(1, AuditEvent::query()
            ->where('action', ContributionAuditAction::VoluntarySavingsRequestReviewed->value)
            ->where('subject_id', $request->id)
            ->count());

        $this->actingAs($associateUser)
            ->getJson('/portal/voluntary-savings-requests')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'approved')
            ->assertJsonPath('data.0.links.signed_authorization_preview', "/portal/voluntary-savings-requests/{$request->id}/signed-authorization/preview")
            ->assertJsonMissingPath('data.0.signed_authorization_storage_key');
        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsRequestReviewed->value,
            'subject_id' => $request->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsPayrollAuthorizationViewed->value,
            'subject_id' => $request->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsPayrollAuthorizationDownloaded->value,
            'subject_id' => $request->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'action' => ContributionAuditAction::VoluntarySavingsSignedAuthorizationUploaded->value,
            'subject_id' => $request->id,
        ]);
    }

    public function test_only_the_active_owner_can_read_each_private_document(): void
    {
        [$owner, $associate] = $this->associateUser();
        [$other] = $this->associateUser('other@example.test');
        $this->actingAs($owner)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => 150000, 'accept_terms' => true,
        ])->assertCreated();
        $request = VoluntarySavingsRequest::query()->firstOrFail();
        $signedKey = "private/test/{$request->id}.pdf";
        Storage::disk('local')->put($signedKey, '%PDF-1.4 signed');
        $request->forceFill(['signed_authorization_storage_key' => $signedKey])->save();

        foreach (['payroll-authorization', 'signed-authorization'] as $document) {
            foreach (['preview', 'download'] as $action) {
                $url = "/portal/voluntary-savings-requests/{$request->id}/{$document}/{$action}";
                $this->actingAs($other)->get($url)->assertForbidden();
                $this->actingAs($owner)->get($url)->assertOk()->assertHeader('Content-Type', 'application/pdf');
                $associate->update(['status' => 'inactive']);
                $this->actingAs($owner->fresh())->get($url)->assertForbidden();
                $associate->update(['status' => 'active']);
                $this->actingAs($owner->fresh());
            }
        }
        $this->actingAs($other)->getJson('/portal/voluntary-savings-requests')->assertExactJson(['data' => []]);
    }

    public function test_rejection_is_immutable_and_retry_creates_a_new_request(): void
    {
        [$owner] = $this->associateUser();
        $admin = $this->userWithRole('admin');
        $this->actingAs($owner)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => 150000, 'accept_terms' => true,
        ])->assertCreated();
        $first = VoluntarySavingsRequest::query()->firstOrFail();
        $this->actingAs($admin)->patchJson("/admin/voluntary-savings-requests/{$first->id}", [
            'status' => 'rejected', 'notes' => 'Revisar el valor solicitado.',
        ])->assertOk();
        $this->actingAs($owner)->getJson('/portal/voluntary-savings-requests')
            ->assertJsonPath('data.0.status', 'rejected')
            ->assertJsonPath('data.0.review_notes', 'Revisar el valor solicitado.');
        $response = $this->actingAs($owner)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => 100000, 'accept_terms' => true,
        ])->assertCreated()->assertJsonPath('data.status', 'submitted');
        $this->assertNotSame($first->id, $response->json('data.id'));
        $this->assertDatabaseHas('voluntary_savings_requests', [
            'id' => $first->id, 'status' => 'rejected', 'monthly_amount' => '150000.00',
            'pending_associate_id' => null,
        ]);
        $this->actingAs($admin)->patchJson("/admin/voluntary-savings-requests/{$first->id}", [
            'status' => 'approved',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('voluntary_savings_requests', 2);
    }

    public function test_real_renderer_generates_a_readable_private_pdf(): void
    {
        $this->app->forgetInstance(RendersVoluntarySavingsPayrollAuthorization::class);
        [$owner] = $this->associateUser();
        $response = $this->actingAs($owner)->postJson('/portal/voluntary-savings-requests', [
            'monthly_amount' => 150000, 'accept_terms' => true,
        ])->assertCreated();
        $request = VoluntarySavingsRequest::query()->findOrFail($response->json('data.id'));
        $contents = Storage::disk('local')->get($request->authorization_storage_key);
        $this->assertStringStartsWith('%PDF-', $contents);
        $this->assertStringContainsString('%%EOF', $contents);
        $this->assertGreaterThan(1000, strlen($contents));
        $this->actingAs($owner)->get($response->json('data.links.payroll_authorization_download'))
            ->assertOk()->assertDownload("libranza-ahorro-voluntario-{$request->id}.pdf");
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
