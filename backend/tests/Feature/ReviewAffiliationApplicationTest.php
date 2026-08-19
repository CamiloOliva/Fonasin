<?php

namespace Tests\Feature;

use App\Application\Affiliation\Exceptions\CannotReviewAffiliationApplication;
use App\Application\Affiliation\UseCases\ApproveAffiliationApplication;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RejectAffiliationApplication;
use App\Application\Affiliation\UseCases\RequestAffiliationCorrection;
use App\Application\Affiliation\UseCases\StartAffiliationReview;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AffiliationApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReviewAffiliationApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_starts_review_and_records_audit_event(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Submitted);
        $reviewer = User::factory()->create();
        $reviewedAt = now('UTC')->startOfSecond();
        $correlationId = (string) Str::uuid();
        $ipHash = hash('sha256', '192.0.2.40');

        $review = app(StartAffiliationReview::class)(
            application: $application,
            actor: $reviewer,
            correlationId: $correlationId,
            ipHash: $ipHash,
            reviewedAt: $reviewedAt,
        );

        $this->assertSame(AffiliationApplicationStatus::UnderReview->value, $review->status);
        $this->assertSame($reviewer->id, $review->reviewed_by_user_id);
        $this->assertSame($reviewedAt->format('Y-m-d H:i:s'), $review->reviewed_at->format('Y-m-d H:i:s'));
        $this->assertNull($review->rejection_reason);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'module' => AuditModule::Affiliation->value,
            'action' => AffiliationAuditAction::ApplicationReviewStarted->value,
            'subject_type' => 'affiliation_application',
            'subject_id' => $application->id,
            'correlation_id' => $correlationId,
            'ip_hash' => $ipHash,
        ]);
    }

    public function test_it_requests_correction_without_storing_sensitive_reason_in_audit_metadata(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = User::factory()->create();

        $correction = app(RequestAffiliationCorrection::class)(
            application: $application,
            actor: $reviewer,
            reason: 'Missing support document.',
        );

        $this->assertSame(AffiliationApplicationStatus::PendingCorrection->value, $correction->status);
        $this->assertSame($reviewer->id, $correction->reviewed_by_user_id);
        $this->assertNull($correction->rejection_reason);

        $event = $correction->refresh()->reviewer
            ->auditEvents()
            ->where('subject_id', $application->id)
            ->where('action', AffiliationAuditAction::ApplicationCorrectionRequested->value)
            ->firstOrFail();

        $this->assertTrue($event->metadata['reason_provided']);
        $this->assertStringNotContainsString('Missing support document.', json_encode($event->metadata, JSON_THROW_ON_ERROR));
    }

    public function test_it_approves_application_and_records_reviewer(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = User::factory()->create();

        $approved = app(ApproveAffiliationApplication::class)($application, $reviewer);

        $this->assertSame(AffiliationApplicationStatus::Approved->value, $approved->status);
        $this->assertSame($reviewer->id, $approved->reviewed_by_user_id);
        $this->assertNull($approved->rejection_reason);

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $reviewer->id,
            'action' => AffiliationAuditAction::ApplicationApproved->value,
            'subject_id' => $application->id,
        ]);
    }

    public function test_it_rejects_application_with_reason_and_redacted_audit_metadata(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = User::factory()->create();

        $rejected = app(RejectAffiliationApplication::class)(
            application: $application,
            actor: $reviewer,
            rejectionReason: 'No cumple las condiciones de afiliacion.',
        );

        $this->assertSame(AffiliationApplicationStatus::Rejected->value, $rejected->status);
        $this->assertSame($reviewer->id, $rejected->reviewed_by_user_id);
        $this->assertSame('No cumple las condiciones de afiliacion.', $rejected->rejection_reason);

        $event = $reviewer->auditEvents()
            ->where('subject_id', $application->id)
            ->where('action', AffiliationAuditAction::ApplicationRejected->value)
            ->firstOrFail();

        $this->assertTrue($event->metadata['reason_recorded']);
        $this->assertStringNotContainsString('No cumple las condiciones', json_encode($event->metadata, JSON_THROW_ON_ERROR));
    }

    public function test_it_rejects_invalid_backoffice_transition(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::Draft);
        $reviewer = User::factory()->create();

        $this->expectException(CannotReviewAffiliationApplication::class);

        app(StartAffiliationReview::class)($application, $reviewer);
    }

    public function test_it_rejects_empty_rejection_reason(): void
    {
        $application = $this->applicationWithStatus(AffiliationApplicationStatus::UnderReview);
        $reviewer = User::factory()->create();

        $this->expectException(CannotReviewAffiliationApplication::class);

        app(RejectAffiliationApplication::class)($application, $reviewer, '   ');
    }

    private function applicationWithStatus(AffiliationApplicationStatus $status): AffiliationApplication
    {
        $application = app(CreateAffiliationDraft::class)();

        $application->forceFill([
            'status' => $status->value,
        ])->save();

        return $application->refresh();
    }
}
