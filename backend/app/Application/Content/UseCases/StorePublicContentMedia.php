<?php

namespace App\Application\Content\UseCases;

use App\Application\Audit\UseCases\RecordAuditEvent;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Audit\Enums\AuditActorType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\PublicContentItem;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StorePublicContentMedia
{
    public function __construct(private readonly StoresPrivateFiles $files, private readonly RecordAuditEvent $audit) {}

    public function __invoke(PublicContentItem $item, string $kind, string $contents, string $mime, User $actor): PublicContentItem
    {
        return DB::transaction(function () use ($item, $kind, $contents, $mime, $actor): PublicContentItem {
            $locked = PublicContentItem::query()->lockForUpdate()->findOrFail($item->id);
            if ($kind === 'document' && $locked->kind !== 'social_balance' && $locked->kind !== 'news') {
                throw new DomainException('Este tipo de contenido no acepta documentos.');
            }
            if ($kind === 'document' && $mime !== 'application/pdf') {
                throw new DomainException('El documento debe ser PDF.');
            }
            $extension = match ($mime) {
                'application/pdf' => 'pdf', 'image/jpeg' => 'jpg',
                'image/png' => 'png', 'image/webp' => 'webp',
                default => throw new DomainException('Formato de archivo no permitido.'),
            };
            if ($kind === 'image' && $extension === 'pdf') {
                throw new DomainException('La imagen debe ser JPG, PNG o WebP.');
            }
            $key = 'private/content/'.$locked->id.'/'.Str::uuid().'.'.$extension;
            $this->files->put($key, $contents);
            $locked->forceFill([
                ...($kind === 'image'
                    ? ['image_storage_key' => $key, 'image_mime_type' => $mime, 'static_image_path' => null]
                    : ['document_storage_key' => $key]),
                // Replacement media needs an explicit review before it becomes public.
                'published' => false,
                'published_at' => null,
            ])->save();

            ($this->audit)(
                module: AuditModule::Content, action: 'content.media_uploaded',
                subjectType: 'public_content_item', subjectId: $locked->id, actor: $actor,
                actorType: AuditActorType::User,
                metadata: ['kind' => $kind, 'mime_type' => $mime, 'byte_size' => strlen($contents), 'unpublished_for_review' => true],
            );

            return $locked->refresh();
        });
    }
}
