<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationPurpose;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Identity\Enums\IdentityAuditAction;
use App\Mail\AssociateActivationMail;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\ImportBatch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Shuchkin\SimpleXLSXGen;
use Tests\TestCase;

class AssociateImportOnboardingHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_imports_associates_without_sending_mass_email(): void
    {
        Storage::fake('local');
        Mail::fake();
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)->postJson('/admin/import-batches/associates', [
            'file' => $this->xlsx('asociados.xlsx', [
                ['documento', 'nombre_completo', 'correo'],
                ['1099001122', '  Persona   Asociada Uno  ', 'PERSONA.UNO@example.test'],
                ['documento-invalido', 'Persona Invalida', 'correo-invalido'],
                ['1099001122', 'Persona Repetida', 'repetida@example.test'],
            ]),
        ])->assertCreated()
            ->assertJsonPath('data.import_type', 'associates')
            ->assertJsonPath('data.status', 'completed_with_errors')
            ->assertJsonPath('data.rows_total', 3)
            ->assertJsonPath('data.rows_created', 1)
            ->assertJsonPath('data.rows_updated', 0)
            ->assertJsonPath('data.rows_rejected', 2)
            ->assertJsonMissingPath('data.storage_key')
            ->assertJsonMissingPath('data.file_hash');

        $associate = Associate::query()->where('full_name', 'Persona Asociada Uno')->firstOrFail();
        $user = $associate->user()->firstOrFail();

        $this->assertSame('persona.uno@example.test', $user->email);
        $this->assertTrue($user->must_change_password);
        $this->assertTrue($user->hasRole('associate'));
        $this->assertNull($user->email_verified_at);
        Mail::assertNothingSent();
        Storage::disk('local')->assertExists(ImportBatch::query()->firstOrFail()->storage_key);
    }

    public function test_only_admin_can_download_template_and_import_associates(): void
    {
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');

        $this->actingAs($reviewer)
            ->get('/admin/import-batches/templates/associates')
            ->assertForbidden();
        $this->actingAs($reviewer)
            ->postJson('/admin/import-batches/associates', [
                'file' => $this->xlsx('asociados.xlsx', [
                    ['documento', 'nombre_completo', 'correo'],
                    ['1099001122', 'Persona Asociada', 'persona@example.test'],
                ]),
            ])
            ->assertForbidden();

        $admin = $this->userWithRole('admin', 'template-admin@example.test');
        $this->actingAs($admin)
            ->get('/admin/import-batches/templates/associates')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_admin_sends_one_activation_link_and_audits_it(): void
    {
        Mail::fake();
        $admin = $this->userWithRole('admin');
        $associate = $this->importedAssociate();

        $this->actingAs($admin)
            ->postJson("/admin/associates/{$associate->id}/activation")
            ->assertOk();

        Mail::assertSent(AssociateActivationMail::class, function (AssociateActivationMail $mail) use ($associate): bool {
            return $mail->hasTo($associate->user->email)
                && str_contains($mail->activationUrl, 'activation=1');
        });
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $associate->user->email]);
        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Identity->value,
            'action' => IdentityAuditAction::AssociateActivationSent->value,
            'subject_id' => $associate->id,
            'actor_user_id' => $admin->id,
        ]);

        $associate->user->forceFill(['must_change_password' => false])->save();

        $this->actingAs($admin)
            ->postJson("/admin/associates/{$associate->id}/activation")
            ->assertUnprocessable();

        Mail::assertSentCount(1);
    }

    public function test_imported_associate_starts_form_only_profile_completion(): void
    {
        $associate = $this->importedAssociate();
        $user = $associate->user;
        $user->forceFill(['must_change_password' => false])->save();

        $this->actingAs($user)
            ->getJson('/auth/user')
            ->assertOk()
            ->assertJsonPath('data.requires_profile_completion', true)
            ->assertJsonPath('data.profile_completion_status', null);

        $response = $this->actingAs($user)
            ->postJson('/portal/affiliation/update-draft')
            ->assertCreated()
            ->assertJsonPath('data.purpose', AffiliationApplicationPurpose::ProfileCompletion->value)
            ->assertJsonPath('data.source_application_id', null);

        $applicationId = $response->json('data.id');
        $draftToken = $response->json('data.draft_access_token');

        $this->actingAs($user)
            ->postJson('/portal/affiliation/update-draft')
            ->assertCreated()
            ->assertJsonPath('data.id', $applicationId);

        $this->assertDatabaseCount('application_sections', 1);

        $application = $associate->affiliationApplications()->findOrFail($applicationId);
        $this->assertTrue($application->isFormOnly());

        $section = ApplicationSection::query()
            ->where('application_id', $applicationId)
            ->where('section', 'personal')
            ->firstOrFail();
        $personal = app(EncryptsSensitiveData::class)->decryptArray($section->getAttribute('data_encrypted'));
        $this->assertSame('CC', $personal['documentType']);
        $this->assertSame('1099001122', $personal['documentNumber']);
        $this->assertSame($user->email, $personal['email']);
        $this->assertArrayNotHasKey('firstName', $personal);

        $this->post(URL::temporarySignedRoute('affiliation-applications.documents.store', now()->addHour(), [
            'application' => $application,
        ], false), [
            'document_type' => ApplicationDocumentType::Identity->value,
            'file' => UploadedFile::fake()->create('identity.pdf', 64, 'application/pdf'),
        ], [
            'Accept' => 'application/json',
            'X-Affiliation-Draft-Token' => $draftToken,
        ])->assertForbidden();
        $this->assertDatabaseCount('application_documents', 0);

        $this->actingAs($user)
            ->getJson('/auth/user')
            ->assertJsonPath('data.profile_completion_status', 'draft');
    }

    public function test_profile_completion_can_be_enabled_without_a_payroll_document(): void
    {
        $associate = $this->importedAssociate();
        $user = $associate->user;
        $admin = $this->userWithRole('admin', 'review-admin@example.test');
        $cipher = app(EncryptsSensitiveData::class);
        $application = $associate->affiliationApplications()->create([
            'purpose' => AffiliationApplicationPurpose::ProfileCompletion->value,
            'status' => AffiliationApplicationStatus::Approved->value,
            'current_step' => 'summary',
            'submitted_at' => now(),
        ]);
        ApplicationSection::query()->forceCreate([
            'application_id' => $application->id,
            'section' => 'personal',
            'schema_version' => 1,
            'data_encrypted' => $cipher->encryptArray([
                'firstName' => 'Persona',
                'middleName' => '',
                'lastName' => 'Asociada',
                'secondLastName' => '',
                'documentType' => 'CC',
                'documentNumber' => '1099001122',
                'email' => $user->email,
            ]),
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson("/admin/affiliation-applications/{$application->id}/enable")
            ->assertOk()
            ->assertJsonPath('data.application.status', 'enabled')
            ->assertJsonPath('data.associate.id', $associate->id)
            ->assertJsonPath('data.activation_required', true);

        $this->assertDatabaseMissing('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::SignedPayrollAuthorization->value,
        ]);
        $this->actingAs($user)
            ->getJson('/auth/user')
            ->assertJsonPath('data.requires_profile_completion', false);
    }

    private function importedAssociate(): Associate
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin', 'import-admin@example.test');
        $this->actingAs($admin)->postJson('/admin/import-batches/associates', [
            'file' => $this->xlsx('asociado-unico.xlsx', [
                ['documento', 'nombre_completo', 'correo'],
                ['1099001122', 'Persona Asociada', 'persona@example.test'],
            ]),
        ])->assertCreated();

        return Associate::query()->with('user')->firstOrFail();
    }

    /** @param array<int, array<int, string>> $rows */
    private function xlsx(string $filename, array $rows): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'fonasin-associates-').'.xlsx';
        SimpleXLSXGen::fromArray($rows)->saveAs($path);

        return new UploadedFile($path, $filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    private function userWithRole(string $roleName, string $email = 'admin@example.test'): User
    {
        $user = User::factory()->create([
            'email' => $email,
            'status' => 'active',
            'must_change_password' => false,
        ]);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
