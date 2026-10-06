<?php

namespace App\Application\Content\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\PublicContentItem;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class SavePublicContent
{
    public function __construct(private readonly RecordAuditEvent $audit) {}

    /** @param array<string, mixed> $data */
    public function __invoke(?PublicContentItem $item, array $data, User $actor): PublicContentItem
    {
        return DB::transaction(function () use ($item, $data, $actor): PublicContentItem {
            $item = $item ? PublicContentItem::query()->lockForUpdate()->findOrFail($item->id) : new PublicContentItem;
            $isNew = ! $item->exists;
            $kind = $isNew ? $data['kind'] : $item->kind;
            if (! $isNew && isset($data['kind']) && $data['kind'] !== $kind) {
                throw new DomainException('No se puede cambiar el tipo de una publicacion existente.');
            }
            $item->fill(collect($data)->only(['title', 'summary', 'category', 'link_url', 'sort_order'])->all());
            if ($isNew) {
                $item->kind = $kind;
            }
            if ($kind === 'agreement' && ! $item->category) {
                throw new DomainException('Selecciona una categoria para el convenio.');
            }
            $publishing = array_key_exists('published', $data) && (bool) $data['published'];
            if ($publishing && $kind === 'social_balance' && ! $item->document_storage_key) {
                throw new DomainException('Carga el PDF de balance social antes de publicarlo.');
            }
            if ($publishing && $kind === 'banner' && ! $item->image_storage_key && ! $item->static_image_path) {
                throw new DomainException('Carga una imagen antes de publicar el banner.');
            }
            if (array_key_exists('published', $data)) {
                $item->published = $publishing;
                $item->published_at = $publishing ? ($item->published_at ?? now()) : null;
            }
            $item->updated_by_user_id = $actor->id;
            $item->save();

            ($this->audit)(
                module: AuditModule::Content, action: $isNew ? 'content.created' : 'content.updated',
                subjectType: 'public_content_item', subjectId: $item->id, actor: $actor,
                actorType: AuditActorType::User,
                metadata: ['kind' => $item->kind, 'published' => $item->published],
            );

            return $item->refresh();
        });
    }
}
