<?php

namespace Tests\Feature;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RecordAuditEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_records_a_redacted_audit_event(): void
    {
        $actor = User::factory()->create();
        $subjectId = (string) Str::uuid();
        $correlationId = (string) Str::uuid();
        $ipHash = hash('sha256', '192.0.2.20');

        $event = app(RecordAuditEvent::class)(
            module: AuditModule::Affiliation,
            action: AffiliationAuditAction::ApplicationSubmitted->value,
            subjectType: 'affiliation_application',
            subjectId: $subjectId,
            actor: $actor,
            actorType: AuditActorType::User,
            correlationId: $correlationId,
            ipHash: $ipHash,
            metadata: [
                'status' => [
                    'from' => 'draft',
                    'to' => 'submitted',
                ],
            ],
        );

        $this->assertTrue($event->actor->is($actor));
        $this->assertSame(AuditActorType::User->value, $event->actor_type);
        $this->assertSame(AuditModule::Affiliation->value, $event->module);
        $this->assertSame(AffiliationAuditAction::ApplicationSubmitted->value, $event->action);
        $this->assertSame('affiliation_application', $event->subject_type);
        $this->assertSame($subjectId, $event->subject_id);
        $this->assertSame($correlationId, $event->correlation_id);
        $this->assertSame($ipHash, $event->getAttribute('ip_hash'));
        $this->assertArrayNotHasKey('ip_hash', $event->toArray());
        $this->assertSame([
            'status' => [
                'from' => 'draft',
                'to' => 'submitted',
            ],
        ], $event->metadata);
    }
}
