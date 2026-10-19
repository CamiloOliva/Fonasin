<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class ProfileDraftAuthorizationTest extends TestCase
{
    use AffiliationSectionPayloads;
    use RefreshDatabase;

    public static function rejectedActors(): array
    {
        $cases = [];
        foreach (['profile_completion', 'data_update'] as $purpose) {
            foreach (['draft', 'pending_correction'] as $status) {
                foreach (['guest', 'other', 'inactive_user', 'password_required', 'inactive_associate'] as $actor) {
                    $cases["$purpose/$status/$actor"] = [$purpose, $status, $actor];
                }
            }
        }

        return $cases;
    }

    #[DataProvider('rejectedActors')]
    public function test_private_draft_requires_active_owner_for_every_operation(string $purpose, string $status, string $actor): void
    {
        [$draft, $owner, $associate] = $this->privateDraft($purpose, $status);
        if ($actor === 'inactive_user') {
            $owner->forceFill(['status' => 'inactive'])->save();
        }
        if ($actor === 'password_required') {
            $owner->forceFill(['must_change_password' => true])->save();
        }
        if ($actor === 'inactive_associate') {
            $associate->forceFill(['status' => 'inactive'])->save();
        }
        if ($actor === 'other') {
            [, $otherOwner] = $this->privateDraft($purpose, 'draft');
            $this->actingAs($otherOwner);
        } elseif ($actor !== 'guest') {
            $this->actingAs($owner);
        }
        $headers = ['X-Affiliation-Draft-Token' => 'synthetic-private-token'];
        $this->getJson($this->link($draft, 'read'), $headers)->assertForbidden();
        $this->postJson($this->link($draft, 'sections.store', ['section' => 'financial']), [
            'schema_version' => 1, 'completed' => false, 'data' => ['otherIncome' => '123'],
        ], $headers)->assertForbidden();
        $this->postJson($this->link($draft, 'consents.store'), ['consent_type' => 'data_processing', 'policy_version' => 'audit-v1'], $headers)->assertForbidden();
        $this->postJson($this->link($draft, 'submit'), ['policy_version' => 'audit-v1'], $headers)->assertForbidden();
        $this->assertDatabaseCount('application_sections', 0);
        $this->assertDatabaseCount('consent_records', 0);
        $this->assertDatabaseCount('application_documents', 0);
        $this->assertSame($status, $draft->fresh()->status);
    }

    public function test_owner_still_needs_valid_token_and_signed_url_and_can_save_own_draft(): void
    {
        foreach (['profile_completion', 'data_update'] as $purpose) {
            [$draft, $owner] = $this->privateDraft($purpose, 'draft');
            $this->actingAs($owner);
            $this->getJson($this->link($draft, 'read'))->assertForbidden();
            $this->getJson($this->link($draft, 'read'), ['X-Affiliation-Draft-Token' => 'wrong'])->assertForbidden();
            $headers = ['X-Affiliation-Draft-Token' => 'synthetic-private-token'];
            $this->getJson('/affiliation-applications/'.$draft->id, $headers)->assertForbidden();
            $this->getJson($this->link($draft, 'read'), $headers)->assertOk();
            $this->postJson($this->link($draft, 'sections.store', ['section' => 'financial']), [
                'schema_version' => 1, 'completed' => false, 'data' => ['otherIncome' => '123'],
            ], $headers)->assertOk();
        }
    }

    public function test_issued_profile_pdf_requires_owner_even_with_public_context_signed_link(): void
    {
        Storage::fake('local');
        foreach (['profile_completion', 'data_update'] as $purpose) {
            [$draft, $owner, $associate] = $this->privateDraft($purpose, 'draft');
            $document = app(RegisterApplicationDocument::class)($draft, ApplicationDocumentType::AffiliationSummary, 'synthetic-summary.pdf', 'application/pdf', 24, fileContents: '%PDF-1.4 synthetic summary');
            $draft->forceFill(['status' => 'submitted', 'access_token_hash' => null])->save();
            foreach (['documents.preview', 'documents.download'] as $action) {
                foreach ([[], ['context' => 'portal']] as $context) {
                    $url = $this->link($draft, $action, ['document' => $document, ...$context]);
                    auth()->logout();
                    $this->getJson($url)->assertForbidden();
                    $this->actingAs(User::factory()->create(['status' => 'active', 'must_change_password' => false]))->getJson($url)->assertForbidden();
                    $this->actingAs($owner)->get($url)->assertOk()->assertHeader('content-type', 'application/pdf');
                    $associate->forceFill(['status' => 'inactive'])->save();
                    $owner->unsetRelation('associate');
                    $this->getJson($url)->assertForbidden();
                    $associate->forceFill(['status' => 'active'])->save();
                    $owner->unsetRelation('associate');
                }
            }
        }
    }

    private function privateDraft(string $purpose, string $status): array
    {
        $owner = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $owner->roles()->attach(Role::query()->firstOrCreate(['name' => 'associate']));
        $associate = Associate::query()->create([
            'user_id' => $owner->id, 'document_type' => 'CC', 'document_number_hash' => hash('sha256', $owner->id),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => '9000000001']),
            'full_name' => 'Synthetic private owner', 'status' => 'active',
        ]);
        $draft = $associate->affiliationApplications()->create([
            'purpose' => $purpose, 'status' => $status, 'current_step' => 'financial',
            'access_token_hash' => hash('sha256', 'synthetic-private-token'),
        ]);
        if ($status === 'pending_correction') {
            $draft->corrections()->create([
                'requested_by_user_id' => $owner->id,
                'reason_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['reason' => 'Synthetic correction']),
                'expires_at' => now()->addHour(),
            ]);
        }

        return [$draft, $owner, $associate];
    }

    private function link(AffiliationApplication $draft, string $action, array $parameters = []): string
    {
        return URL::temporarySignedRoute('affiliation-applications.'.$action, now()->addHour(), ['application' => $draft, ...$parameters], false);
    }
}
