<?php

namespace Tests\Feature;

use App\Models\AffiliationApplication;
use App\Models\ApplicationDocument;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\AuditEvent;
use App\Models\AuthEvent;
use App\Models\ConsentRecord;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class CorePersistenceModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_affiliation_models_generate_uuids_and_expose_bidirectional_relationships(): void
    {
        $reviewer = User::factory()->create();
        $associate = $this->createAssociate();
        $application = AffiliationApplication::query()->create([
            'associate_id' => $associate->id,
            'status' => 'under_review',
            'current_step' => 'documents',
            'submitted_at' => now(),
            'reviewed_by_user_id' => $reviewer->id,
            'reviewed_at' => now(),
        ]);
        $section = ApplicationSection::query()->create([
            'application_id' => $application->id,
            'section' => 'personal',
            'schema_version' => 1,
            'data_encrypted' => 'test-ciphertext',
            'completed_at' => now(),
        ]);
        $document = ApplicationDocument::query()->create([
            'application_id' => $application->id,
            'document_type' => 'identity',
            'original_filename' => 'synthetic-document.pdf',
            'storage_key' => 'private/test/'.Str::uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 1024,
            'status' => 'uploaded',
            'uploaded_at' => now(),
        ]);
        $consent = ConsentRecord::query()->create([
            'application_id' => $application->id,
            'consent_type' => 'data_processing',
            'policy_version' => 'test-v1',
            'accepted_at' => now(),
            'ip_hash' => hash('sha256', '192.0.2.1'),
        ]);

        foreach ([$application, $section, $document, $consent] as $model) {
            $this->assertTrue(Str::isUuid($model->id));
        }

        $this->assertTrue($application->associate->is($associate));
        $this->assertTrue($associate->affiliationApplications->contains($application));
        $this->assertTrue($application->reviewer->is($reviewer));
        $this->assertTrue($reviewer->reviewedAffiliationApplications->contains($application));
        $this->assertTrue($application->sections->contains($section));
        $this->assertTrue($section->application->is($application));
        $this->assertTrue($application->documents->contains($document));
        $this->assertTrue($document->application->is($application));
        $this->assertTrue($application->consentRecords->contains($consent));
        $this->assertTrue($consent->application->is($application));
    }

    public function test_credit_model_casts_values_and_exposes_bidirectional_relationships(): void
    {
        $registrar = User::factory()->create();
        $associate = $this->createAssociate();
        $credit = CreditAccount::query()->create([
            'associate_id' => $associate->id,
            'credit_line' => 'FONALIBRE',
            'initial_balance' => '1250000.50',
            'current_balance' => '1000000.25',
            'term_months' => 24,
            'interest_rate' => '1.2500',
            'installment_amount' => '52000.75',
            'status' => 'active',
            'registered_by_user_id' => $registrar->id,
        ]);

        $this->assertTrue(Str::isUuid($credit->id));
        $this->assertSame('1250000.50', $credit->initial_balance);
        $this->assertSame('1000000.25', $credit->current_balance);
        $this->assertSame(24, $credit->term_months);
        $this->assertSame('1.2500', $credit->interest_rate);
        $this->assertSame('52000.75', $credit->installment_amount);
        $this->assertTrue($credit->associate->is($associate));
        $this->assertTrue($associate->creditAccounts->contains($credit));
        $this->assertTrue($credit->registeredBy->is($registrar));
        $this->assertTrue($registrar->registeredCreditAccounts->contains($credit));
    }

    public function test_event_models_cast_metadata_and_expose_user_relationships(): void
    {
        $user = User::factory()->create();
        $subjectId = (string) Str::uuid();
        $correlationId = (string) Str::uuid();
        $auditEvent = AuditEvent::query()->create([
            'occurred_at' => now(),
            'actor_user_id' => $user->id,
            'actor_type' => 'user',
            'module' => 'affiliation',
            'action' => 'application.submitted',
            'subject_type' => 'affiliation_application',
            'subject_id' => $subjectId,
            'correlation_id' => $correlationId,
            'ip_hash' => hash('sha256', '192.0.2.2'),
            'metadata' => ['source' => 'test'],
        ]);
        $authEvent = AuthEvent::query()->create([
            'occurred_at' => now(),
            'user_id' => $user->id,
            'event_type' => 'login.succeeded',
            'email_hash' => hash('sha256', 'synthetic@example.test'),
            'ip_hash' => hash('sha256', '192.0.2.3'),
            'user_agent_hash' => hash('sha256', 'synthetic-agent'),
            'correlation_id' => $correlationId,
            'metadata' => ['method' => 'password'],
        ]);

        $this->assertTrue(Str::isUuid($auditEvent->id));
        $this->assertTrue(Str::isUuid($authEvent->id));
        $this->assertInstanceOf(Carbon::class, $auditEvent->occurred_at);
        $this->assertInstanceOf(Carbon::class, $authEvent->occurred_at);
        $this->assertSame(['source' => 'test'], $auditEvent->metadata);
        $this->assertSame(['method' => 'password'], $authEvent->metadata);
        $this->assertTrue($auditEvent->actor->is($user));
        $this->assertTrue($authEvent->user->is($user));
        $this->assertTrue($user->auditEvents->contains($auditEvent));
        $this->assertTrue($user->authEvents->contains($authEvent));
        $this->assertFalse($auditEvent->usesTimestamps());
        $this->assertFalse($authEvent->usesTimestamps());
    }

    public function test_private_persistence_fields_are_hidden_from_serialization(): void
    {
        $user = User::factory()->create();
        $associate = $this->createAssociate();
        $application = AffiliationApplication::query()->create([
            'associate_id' => $associate->id,
            'status' => 'draft',
        ]);
        $section = ApplicationSection::query()->create([
            'application_id' => $application->id,
            'section' => 'sarlaft',
            'schema_version' => 1,
            'data_encrypted' => 'test-ciphertext',
        ]);
        $document = ApplicationDocument::query()->create([
            'application_id' => $application->id,
            'document_type' => 'identity',
            'original_filename' => 'synthetic-document.pdf',
            'storage_key' => 'private/test/'.Str::uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 512,
            'status' => 'uploaded',
            'uploaded_at' => now(),
        ]);
        $consent = ConsentRecord::query()->create([
            'application_id' => $application->id,
            'consent_type' => 'data_processing',
            'policy_version' => 'test-v1',
            'accepted_at' => now(),
            'ip_hash' => hash('sha256', '192.0.2.4'),
        ]);
        $auditEvent = AuditEvent::query()->create([
            'occurred_at' => now(),
            'actor_user_id' => $user->id,
            'actor_type' => 'user',
            'module' => 'affiliation',
            'action' => 'document.uploaded',
            'subject_type' => 'application_document',
            'subject_id' => $document->id,
            'ip_hash' => hash('sha256', '192.0.2.5'),
            'metadata' => [],
        ]);
        $authEvent = AuthEvent::query()->create([
            'occurred_at' => now(),
            'user_id' => $user->id,
            'event_type' => 'login.failed',
            'email_hash' => hash('sha256', 'synthetic@example.test'),
            'ip_hash' => hash('sha256', '192.0.2.6'),
            'user_agent_hash' => hash('sha256', 'synthetic-agent'),
            'metadata' => [],
        ]);

        $this->assertArrayNotHasKey('data_encrypted', $section->toArray());
        $this->assertArrayNotHasKey('storage_key', $document->toArray());
        $this->assertArrayNotHasKey('ip_hash', $consent->toArray());
        $this->assertArrayNotHasKey('ip_hash', $auditEvent->toArray());
        $this->assertArrayNotHasKey('email_hash', $authEvent->toArray());
        $this->assertArrayNotHasKey('ip_hash', $authEvent->toArray());
        $this->assertArrayNotHasKey('user_agent_hash', $authEvent->toArray());
    }

    private function createAssociate(): Associate
    {
        $reference = (string) Str::uuid();

        return Associate::query()->create([
            'document_type' => 'test',
            'document_number_hash' => hash('sha256', $reference),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Test Person',
            'status' => 'applicant',
        ]);
    }
}
