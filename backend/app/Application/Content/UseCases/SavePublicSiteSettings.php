<?php

namespace App\Application\Content\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SavePublicSiteSettings
{
    public function __construct(private readonly RecordAuditEvent $audit) {}

    /** @param array<string, string|null> $settings */
    public function __invoke(array $settings, User $actor): void
    {
        DB::transaction(function () use ($settings, $actor): void {
            foreach ($settings as $key => $value) {
                DB::table('public_site_settings')->updateOrInsert(
                    ['key' => $key],
                    ['value' => $value, 'updated_by_user_id' => $actor->id, 'updated_at' => now()],
                );
            }
            ($this->audit)(
                module: AuditModule::Content, action: 'content.settings_updated',
                subjectType: 'public_site_settings', subjectId: $actor->id,
                actor: $actor, actorType: AuditActorType::User,
                metadata: ['keys' => array_keys($settings)],
            );
        });
    }
}
