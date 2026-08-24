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
        $reviewer = $this->userWithRole('reviewer');

        $this->actingAs($reviewer)
            ->getJson('/admin/affiliation-applications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $application->id)
            ->assertJsonPath('data.0.status', AffiliationApplicationStatus::Submitted->value);
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
