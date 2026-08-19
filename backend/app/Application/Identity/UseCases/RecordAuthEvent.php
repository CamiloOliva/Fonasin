<?php

namespace App\Application\Identity\UseCases;

use App\Domain\Identity\Enums\AuthEventType;
use App\Models\AuthEvent;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class RecordAuthEvent
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __invoke(
        AuthEventType $eventType,
        ?User $user = null,
        ?string $emailHash = null,
        ?string $ipHash = null,
        ?string $userAgentHash = null,
        ?string $correlationId = null,
        array $metadata = [],
        ?Carbon $occurredAt = null,
    ): AuthEvent {
        return AuthEvent::query()->forceCreate([
            'occurred_at' => $occurredAt ?? now(),
            'user_id' => $user?->id,
            'event_type' => $eventType->value,
            'email_hash' => $emailHash,
            'ip_hash' => $ipHash,
            'user_agent_hash' => $userAgentHash,
            'correlation_id' => $correlationId ?? (string) Str::uuid(),
            'metadata' => $metadata,
        ]);
    }
}
