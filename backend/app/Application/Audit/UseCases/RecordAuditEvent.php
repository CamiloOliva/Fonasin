<?php

namespace App\Application\Audit\UseCases;

use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class RecordAuditEvent
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __invoke(
        AuditModule $module,
        string $action,
        string $subjectType,
        string $subjectId,
        ?User $actor = null,
        AuditActorType $actorType = AuditActorType::System,
        ?string $correlationId = null,
        ?string $ipHash = null,
        array $metadata = [],
        ?Carbon $occurredAt = null,
    ): AuditEvent {
        return AuditEvent::query()->forceCreate([
            'occurred_at' => $occurredAt ?? now(),
            'actor_user_id' => $actor?->id,
            'actor_type' => $actorType->value,
            'module' => $module->value,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'correlation_id' => $correlationId ?? (string) Str::uuid(),
            'ip_hash' => $ipHash,
            'metadata' => $metadata,
        ]);
    }
}
