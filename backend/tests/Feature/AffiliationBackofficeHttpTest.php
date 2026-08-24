<?php

namespace Tests\Feature;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AffiliationBackofficeHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_backoffice_affiliation_actions(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);

        $this->getJson('/admin/affiliation-applications')
            ->assertUnauthorized();

        $this->getJson("/admin/affiliation-applications/{$application->id}")
            ->assertUnauthorized();

        $this->postJson("/admin/affiliation-applications/{$application->id}/review")
            ->assertUnauthorized();
    }

    public function test_authenticated_user_without_backoffice_role_cannot_review_application(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/admin/affiliation-applications')
            ->assertForbidden();

        $this->actingAs($user)
            ->getJson("/admin/affiliation-applications/{$application->id}")
            ->assertForbidden();

        $this->actingAs($user)
            ->postJson("/admin/affiliation-applications/{$application->id}/review")
            ->assertForbidden();
    }

    public function test_reviewer_can_list_affiliation_applications_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);
        $draft = $this->applicationWithStatus(AffiliationApplicationStatus::Draft);
        $reviewer = $this->userWithRole('reviewer');

        $this->actingAs($reviewer)
            ->getJson('/admin/affiliation-applications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $application->id)
            ->assertJsonPath('data.0.status', AffiliationApplicationStatus::Submitted->value)
            ->assertJsonMissing(['id' => $draft->id]);
    }

    public function test_reviewer_can_read_affiliation_application_detail_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);
        $reviewer = $this->userWithRole('reviewer');
        $cipher = app(EncryptsSensitiveData::class);

        ApplicationSection::query()->forceCreate([
            'application_id' => $application->id,
            'section' => AffiliationApplicationStep::Personal->value,
            'schema_version' => 1,
            'data_encrypted' => $cipher->encryptArray([
                'firstName' => 'Ana',
                'lastName' => 'Prueba',
                'documentNumber' => '123456789',
            ]),
            'completed_at' => now(),
        ]);

        ApplicationDocument::query()->forceCreate([
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::Identity->value,
            'original_filename' => 'cedula.pdf',
            'storage_key' => 'private/affiliations/demo/cedula.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 128,
            'status' => ApplicationDocumentStatus::Uploaded->value,
            'uploaded_at' => now(),
        ]);

        $this->actingAs($reviewer)
            ->getJson("/admin/affiliation-applications/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.sections.0.section', AffiliationApplicationStep::Personal->value)
            ->assertJsonPath('data.sections.0.data.firstName', 'Ana')
            ->assertJsonPath('data.sections.0.data.documentNumber', '123456789')
            ->assertJsonPath('data.documents.0.document_type', ApplicationDocumentType::Identity->value);
    }

    public function test_reviewer_can_start_review_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);
        $reviewer = $this->userWithRole('reviewer');

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/review");

        $response->assertOk()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.status', AffiliationApplicationStatus::UnderReview->value)
            ->assertJsonPath('data.reviewed_by_user_id', $reviewer->id);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => AffiliationAuditAction::ApplicationReviewStarted->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_admin_can_request_correction_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $admin = $this->userWithRole('admin');

        $response = $this->actingAs($admin)
            ->postJson("/admin/affiliation-applications/{$application->id}/correction", [
                'reason' => 'Missing document.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::PendingCorrection->value)
            ->assertJsonPath('data.reviewed_by_user_id', $admin->id);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->id,
            'action' => AffiliationAuditAction::ApplicationCorrectionRequested->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_reviewer_can_approve_application_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = $this->userWithRole('reviewer');

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Approved->value)
            ->assertJsonPath('data.reviewed_by_user_id', $reviewer->id);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => AffiliationAuditAction::ApplicationApproved->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_reviewer_can_upload_signed_payroll_authorization_over_http(): void
    {
        Storage::fake('local');

        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Approved);
        $reviewer = $this->userWithRole('reviewer');

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/signed-payroll-authorization", [
                'document_type' => ApplicationDocumentType::SignedPayrollAuthorization->value,
                'file' => UploadedFile::fake()->create('libranza-firmada.pdf', 128, 'application/pdf'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.document_type', ApplicationDocumentType::SignedPayrollAuthorization->value)
            ->assertJsonPath('data.original_filename', 'libranza-firmada.pdf');

        $this->assertDatabaseHas('application_documents', [
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::SignedPayrollAuthorization->value,
            'status' => ApplicationDocumentStatus::Uploaded->value,
        ]);
    }

    public function test_reviewer_can_enable_application_after_signed_payroll_authorization(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Approved);
        $reviewer = $this->userWithRole('reviewer');
        $cipher = app(EncryptsSensitiveData::class);

        ApplicationSection::query()->forceCreate([
            'application_id' => $application->id,
            'section' => AffiliationApplicationStep::Personal->value,
            'schema_version' => 1,
            'data_encrypted' => $cipher->encryptArray([
                'documentType' => 'CC',
                'documentNumber' => '123456789',
                'firstName' => 'Ana',
                'middleName' => 'Maria',
                'lastName' => 'Prueba',
                'secondLastName' => 'Perez',
                'email' => 'ana.prueba@example.test',
            ]),
            'completed_at' => now(),
        ]);

        ApplicationDocument::query()->forceCreate([
            'application_id' => $application->id,
            'document_type' => ApplicationDocumentType::SignedPayrollAuthorization->value,
            'original_filename' => 'libranza-firmada.pdf',
            'storage_key' => 'private/affiliations/demo/libranza-firmada.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 128,
            'status' => ApplicationDocumentStatus::Uploaded->value,
            'uploaded_at' => now(),
        ]);

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/enable");

        $response->assertOk()
            ->assertJsonPath('data.application.status', AffiliationApplicationStatus::Enabled->value)
            ->assertJsonPath('data.associate.full_name', 'Ana Maria Prueba Perez')
            ->assertJsonPath('data.user.email', 'ana.prueba@example.test');

        $this->assertDatabaseHas('associates', [
            'document_type' => 'CC',
            'document_number_hash' => hash('sha256', '123456789'),
            'full_name' => 'Ana Maria Prueba Perez',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $application->id,
            'status' => AffiliationApplicationStatus::Enabled->value,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => AffiliationAuditAction::ApplicationEnabled->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_application_cannot_be_enabled_without_signed_payroll_authorization(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Approved);
        $reviewer = $this->userWithRole('reviewer');

        $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/enable")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Application cannot be enabled without signed payroll authorization.');
    }

    public function test_reviewer_can_reject_application_over_http(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = $this->userWithRole('reviewer');

        $response = $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/reject", [
                'reason' => 'No cumple condiciones.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', AffiliationApplicationStatus::Rejected->value)
            ->assertJsonPath('data.reviewed_by_user_id', $reviewer->id);

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $application->id,
            'rejection_reason' => 'No cumple condiciones.',
        ]);
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => AffiliationAuditAction::ApplicationRejected->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_reject_requires_reason(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = $this->userWithRole('reviewer');

        $this->actingAs($reviewer)
            ->postJson("/admin/affiliation-applications/{$application->id}/reject")
            ->assertUnprocessable();
    }

    private function applicationWithStatus(AffiliationApplicationStatus $status): AffiliationApplication
    {
        return AffiliationApplication::query()->forceCreate([
            'status' => $status->value,
            'current_step' => AffiliationApplicationStep::Summary->value,
        ]);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
