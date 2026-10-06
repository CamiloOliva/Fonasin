<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\PublicContentItem;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicContentHttpTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $role): User
    {
        $user = User::factory()->create(['must_change_password' => false]);
        $user->roles()->attach(Role::query()->firstOrCreate(['name' => $role])->id, ['created_at' => now()]);

        return $user;
    }

    public function test_public_sees_only_published_items_and_official_settings(): void
    {
        $publicResponse = $this->getJson('/public/content')->assertOk()
            ->assertJsonPath('settings.contact_email', 'fonasin.bucaramanga@fonasin.com');
        $this->assertStringContainsString('no-store', $publicResponse->headers->get('Cache-Control'));
        // Some MariaDB test classes truncate migration data; create the fixture explicitly.
        $staticBanner = PublicContentItem::query()->firstOrCreate(
            ['kind' => 'banner', 'title' => 'Banner estatico de prueba'],
            ['static_image_path' => '/flyer1.png', 'published' => true],
        );
        $this->get("/public/content/{$staticBanner->id}/image")->assertNotFound();
        $admin = $this->actor('admin');
        $draft = $this->actingAs($admin)->postJson('/admin/content', [
            'kind' => 'news', 'title' => 'Comunicado de prueba', 'summary' => 'Texto aprobado por FONASIN.',
        ])->assertCreated()->json('data.id');
        $this->getJson('/public/content')->assertJsonMissing(['id' => $draft]);
        $this->actingAs($admin)->patchJson("/admin/content/{$draft}", ['published' => true])->assertOk();
        $this->getJson('/public/content')->assertJsonFragment(['id' => $draft]);
        $this->actingAs($admin)->patchJson("/admin/content/{$draft}", ['published' => false])->assertOk();
        $this->getJson('/public/content')->assertJsonMissing(['id' => $draft]);
        $this->assertDatabaseHas('audit_events', ['subject_id' => $draft, 'action' => 'content.updated']);
    }

    public function test_only_admin_can_mutate_and_unpublished_media_is_private(): void
    {
        Storage::fake('local');
        $reviewer = $this->actor('reviewer');
        $admin = $this->actor('admin');
        $this->actingAs($reviewer)->postJson('/admin/content', ['kind' => 'news', 'title' => 'No permitido'])->assertForbidden();
        $this->actingAs($reviewer)->getJson('/admin/content')->assertOk();
        $id = $this->actingAs($admin)->postJson('/admin/content', ['kind' => 'social_balance', 'title' => 'Informe 2025'])
            ->assertCreated()->json('data.id');
        $this->actingAs($admin)->patchJson("/admin/content/{$id}", ['published' => true])->assertUnprocessable();
        $this->actingAs($reviewer)->post("/admin/content/{$id}/media", [
            'kind' => 'document', 'file' => UploadedFile::fake()->create('balance.pdf', 64, 'application/pdf'),
        ])->assertForbidden();
        $this->actingAs($admin)->post("/admin/content/{$id}/media", [
            'kind' => 'document', 'file' => UploadedFile::fake()->create('balance.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertOk();
        $this->get("/public/content/{$id}/document")->assertNotFound();
        $this->actingAs($reviewer)->get("/admin/content/{$id}/document")->assertOk()->assertHeader('Content-Type', 'application/pdf');
        auth()->logout();
        $this->getJson("/admin/content/{$id}/document")->assertUnauthorized();
        $this->actingAs($admin)->patchJson("/admin/content/{$id}", ['published' => true])->assertOk();
        $document = $this->get("/public/content/{$id}/document")->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('no-store', $document->headers->get('Cache-Control'));
        $this->actingAs($admin)->post("/admin/content/{$id}/media", [
            'kind' => 'document', 'file' => UploadedFile::fake()->create('balance-corregido.pdf', 64, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.published', false);
        $this->get("/public/content/{$id}/document")->assertNotFound();
        $this->actingAs($admin)->get("/admin/content/{$id}/document")->assertOk();
        $this->assertNotNull(PublicContentItem::query()->findOrFail($id)->document_storage_key);
        $this->assertSame(2, AuditEvent::query()->where('action', 'content.media_uploaded')->where('subject_id', $id)->count());
    }

    public function test_settings_validate_social_hosts_and_publish_email_without_build(): void
    {
        $admin = $this->actor('admin');
        $reviewer = $this->actor('reviewer');
        $settings = [
            'contact_email' => 'contacto@fonasin.com', 'facebook_url' => null,
            'instagram_url' => 'https://www.instagram.com/fonasin/', 'youtube_url' => null,
        ];
        $this->actingAs($reviewer)->putJson('/admin/content/settings', $settings)->assertForbidden();
        $this->actingAs($admin)->putJson('/admin/content/settings', [
            ...$settings, 'instagram_url' => 'https://instagram.com.evil.test/fonasin',
        ])->assertUnprocessable();
        $this->actingAs($admin)->putJson('/admin/content/settings', $settings)->assertOk();
        $this->getJson('/public/content')->assertJsonPath('settings.contact_email', 'contacto@fonasin.com')
            ->assertJsonPath('settings.instagram_url', 'https://www.instagram.com/fonasin/');
    }

    public function test_agreement_requires_valid_category_and_banner_image_before_publication(): void
    {
        $admin = $this->actor('admin');
        $this->actingAs($admin)->postJson('/admin/content', [
            'kind' => 'agreement', 'title' => 'Convenio nuevo',
        ])->assertUnprocessable()->assertJsonValidationErrors('category');
        $agreementId = $this->actingAs($admin)->postJson('/admin/content', [
            'kind' => 'agreement', 'title' => 'Convenio nuevo', 'category' => 'Turismo',
        ])->assertCreated()->json('data.id');
        $this->actingAs($admin)->patchJson("/admin/content/{$agreementId}", [
            'category' => null,
        ])->assertUnprocessable();
        $this->assertDatabaseHas('public_content_items', ['id' => $agreementId, 'category' => 'Turismo']);
        $bannerId = $this->actingAs($admin)->postJson('/admin/content', [
            'kind' => 'banner', 'title' => 'Campaña nueva',
        ])->assertCreated()->json('data.id');
        $this->actingAs($admin)->patchJson("/admin/content/{$bannerId}", [
            'published' => true,
        ])->assertUnprocessable();
        $this->getJson('/public/content')->assertJsonMissing(['id' => $bannerId]);
    }
}
