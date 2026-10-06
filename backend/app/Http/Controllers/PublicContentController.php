<?php

namespace App\Http\Controllers;

use App\Application\Content\UseCases\SavePublicContent;
use App\Application\Content\UseCases\SavePublicSiteSettings;
use App\Application\Content\UseCases\StorePublicContentMedia;
use App\Application\Storage\Contracts\ReadsPrivateFiles;
use App\Http\Requests\Content\SavePublicContentRequest;
use App\Http\Requests\Content\SavePublicSiteSettingsRequest;
use App\Http\Requests\Content\StorePublicContentMediaRequest;
use App\Models\PublicContentItem;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicContentController extends Controller
{
    private const LEGACY_AGREEMENT_SLUGS = [
        '/images/convenios/caribbean-sol-mar-logo.jpg' => 'caribbean-sol-y-mar',
        '/images/convenios/luz-marina-vargas-logo.jpg' => 'luz-marina-vargas',
        '/images/convenios/emi.png' => 'emi',
        '/images/convenios/sanitas.png' => 'sanitas',
        '/images/convenios/emermedica.png' => 'emermedica',
        '/images/convenios/uma-ips.png' => 'uma-ips',
        '/images/convenios/coorserpark.png' => 'coorserpark',
        '/images/convenios/los-olivos.png' => 'los-olivos',
        '/images/convenios/manejar.png' => 'manejar',
        '/images/convenios/practicar.png' => 'practicar',
    ];

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => PublicContentItem::query()->where('published', true)
                ->orderBy('kind')->orderBy('sort_order')->orderBy('published_at', 'desc')->get()
                ->map(fn (PublicContentItem $item): array => $this->payload($item))->values(),
            'settings' => $this->settings(),
        ])->header('Cache-Control', 'no-store');
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json([
            'data' => PublicContentItem::query()->orderBy('kind')->orderBy('sort_order')->get()
                ->map(fn (PublicContentItem $item): array => $this->payload($item))->values(),
            'settings' => $this->settings(),
        ])->header('Cache-Control', 'no-store');
    }

    public function store(SavePublicContentRequest $request, SavePublicContent $save): JsonResponse
    {
        try {
            $item = $save(null, $request->validated(), $request->user());
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($item)], 201);
    }

    public function update(SavePublicContentRequest $request, PublicContentItem $item, SavePublicContent $save): JsonResponse
    {
        try {
            $item = $save($item, $request->validated(), $request->user());
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($item)]);
    }

    public function storeMedia(StorePublicContentMediaRequest $request, PublicContentItem $item, StorePublicContentMedia $store): JsonResponse
    {
        try {
            $file = $request->file('file');
            $item = $store($item, $request->string('kind')->toString(), $file->get(), $file->getMimeType(), $request->user());
        } catch (DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $this->payload($item)]);
    }

    public function saveSettings(SavePublicSiteSettingsRequest $request, SavePublicSiteSettings $save): JsonResponse
    {
        $save($request->validated(), $request->user());

        return response()->json(['settings' => $this->settings()]);
    }

    public function image(PublicContentItem $item, ReadsPrivateFiles $files): StreamedResponse
    {
        return $this->media($item, $files, 'image_storage_key', $item->image_mime_type ?: 'application/octet-stream', true);
    }

    public function document(PublicContentItem $item, ReadsPrivateFiles $files): StreamedResponse
    {
        return $this->media($item, $files, 'document_storage_key', 'application/pdf', true);
    }

    public function previewImage(PublicContentItem $item, ReadsPrivateFiles $files): StreamedResponse
    {
        return $this->media($item, $files, 'image_storage_key', $item->image_mime_type ?: 'application/octet-stream', false);
    }

    public function previewDocument(PublicContentItem $item, ReadsPrivateFiles $files): StreamedResponse
    {
        return $this->media($item, $files, 'document_storage_key', 'application/pdf', false);
    }

    private function media(PublicContentItem $item, ReadsPrivateFiles $files, string $field, string $mime, bool $requirePublished): StreamedResponse
    {
        abort_if($requirePublished && ! $item->published, 404);
        $key = $item->getAttribute($field);
        abort_unless(is_string($key) && $key !== '', 404);
        $stream = $files->open($key);
        abort_unless(is_resource($stream), 404);

        return response()->stream(function () use ($stream): void {
            try {
                fpassthru($stream);
            } finally {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(PublicContentItem $item): array
    {
        return [
            'id' => $item->id, 'kind' => $item->kind, 'title' => $item->title,
            'summary' => $item->summary, 'category' => $item->category,
            'link_url' => $item->link_url, 'sort_order' => $item->sort_order,
            'published' => $item->published, 'published_at' => $item->published_at?->toISOString(),
            'legacy_detail_slug' => self::LEGACY_AGREEMENT_SLUGS[$item->static_image_path] ?? null,
            'legacy_detail_modified' => $item->updated_by_user_id !== null,
            'image_url' => $item->image_storage_key ? "/public/content/{$item->id}/image" : $item->static_image_path,
            'document_url' => $item->document_storage_key ? "/public/content/{$item->id}/document" : null,
        ];
    }

    /** @return array<string, string|null> */
    private function settings(): array
    {
        return array_merge([
            'contact_email' => 'fonasin.bucaramanga@fonasin.com',
            'facebook_url' => null,
            'instagram_url' => null,
            'youtube_url' => null,
        ], DB::table('public_site_settings')->pluck('value', 'key')->all());
    }
}
