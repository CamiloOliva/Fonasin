<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
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

class SubmissionRevalidationHttpTest extends TestCase
{
    use AffiliationSectionPayloads;
    use RefreshDatabase;

    public static function legacySections(): array
    {
        $cases = [];
        foreach (['initial_affiliation', 'profile_completion', 'data_update'] as $purpose) {
            foreach (['draft', 'pending_correction'] as $status) {
                foreach (['personal', 'employment', 'financial', 'beneficiaries', 'sarlaft', 'financial_total'] as $section) {
                    $cases["$purpose/$status/$section"] = [$purpose, $status, $section];
                }
            }
        }

        return $cases;
    }

    #[DataProvider('legacySections')]
    public function test_submit_revalidates_legacy_completed_sections_before_any_document_or_status_change(string $purpose, string $status, string $case): void
    {
        [$draft, $previous] = $this->readyDraft($purpose, $status);
        $name = $case === 'financial_total' ? 'financial' : $case;
        $section = $draft->sections()->where('section', $name)->firstOrFail();
        $cipher = app(EncryptsSensitiveData::class);
        $data = $cipher->decryptArray($section->getAttribute('data_encrypted'));
        $data = match ($case) {
            'personal' => [...$data, 'email' => 'invalid-email'],
            'employment' => [...$data, 'position' => ''],
            'financial' => [...$data, 'otherIncome' => '=123', 'totalIncome' => '2500123'],
            'financial_total' => [...$data, 'totalIncome' => '999'],
            'beneficiaries' => [...$data, 'emergencyContact' => []],
            'sarlaft' => [...$data, 'pep' => 'Si', 'pepPosition' => ''],
        };
        // Model an existing pre-fix draft, not a new write through today's validator.
        $section->forceFill(['data_encrypted' => $cipher->encryptArray($data)])->save();
        $encrypted = $section->getAttribute('data_encrypted');
        $count = $draft->documents()->count();
        $token = $draft->access_token_hash;
        $this->postJson($this->link($draft, 'submit'), ['policy_version' => 'audit-v1'], $this->headers())->assertUnprocessable();
        $this->assertSame($status, $draft->fresh()->status);
        $this->assertSame($token, $draft->fresh()->access_token_hash);
        $this->assertSame($encrypted, $section->fresh()->getAttribute('data_encrypted'));
        $this->assertSame($count, $draft->documents()->count());
        $this->assertSame('uploaded', $previous->fresh()->status);
        $this->assertSame('%PDF-1.4 historical synthetic', Storage::disk('local')->get($previous->storage_key));
        $this->assertDatabaseMissing('audit_events', ['subject_id' => $draft->id, 'action' => 'application.submitted']);
        $this->assertDatabaseMissing('audit_events', ['action' => 'document.generated']);
        $this->assertSame(0, $draft->corrections()->whereNotNull('completed_at')->count());
        // Correct the affected section normally; the same draft can then be sent.
        $this->postJson($this->link($draft, 'sections.store', ['section' => $name]), ['schema_version' => 1, 'data' => $this->validSectionPayload(AffiliationApplicationStep::from($name))], $this->headers())->assertOk();
        $this->postJson($this->link($draft, 'submit'), ['policy_version' => 'audit-v1'], $this->headers())->assertOk()->assertJsonPath('data.status', 'submitted');
        $this->assertSame('%PDF-1.4 historical synthetic', Storage::disk('local')->get($previous->storage_key));
    }

    private function readyDraft(string $purpose, string $status): array
    {
        Storage::fake('local');
        $owner = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $owner->roles()->attach(Role::query()->firstOrCreate(['name' => 'associate']));
        $associate = Associate::query()->create(['user_id' => $owner->id, 'document_type' => 'CC', 'document_number_hash' => hash('sha256', $owner->id), 'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => '9000000001']), 'full_name' => 'Synthetic legacy owner', 'status' => 'active']);
        $draft = AffiliationApplication::query()->create(['associate_id' => $associate->id, 'purpose' => $purpose, 'status' => $status, 'current_step' => 'financial', 'access_token_hash' => hash('sha256', 'synthetic-legacy-token')]);
        if ($purpose !== 'initial_affiliation') {
            $this->actingAs($owner);
        }
        if ($status === 'pending_correction') {
            $draft->corrections()->create(['requested_by_user_id' => $owner->id, 'reason_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['reason' => 'Synthetic correction']), 'expires_at' => now()->addHour()]);
        }
        foreach (AffiliationApplicationStep::formSections() as $step) {
            app(SaveApplicationSection::class)($draft, $step, 1, $this->validSectionPayload($step), now());
        }
        if ($purpose === 'initial_affiliation') {
            foreach (ApplicationDocumentType::requiredForSubmission() as $type) {
                app(RegisterApplicationDocument::class)($draft, $type, 'synthetic.pdf', 'application/pdf', 24, fileContents: '%PDF-1.4 synthetic');
            }
        }
        foreach (ConsentType::requiredForSubmission() as $type) {
            app(AcceptApplicationConsent::class)($draft, $type, 'audit-v1');
        }
        $previous = app(RegisterApplicationDocument::class)($draft, ApplicationDocumentType::AffiliationSummary, 'historical.pdf', 'application/pdf', 29, fileContents: '%PDF-1.4 historical synthetic');

        return [$draft, $previous];
    }

    private function link(AffiliationApplication $draft, string $action, array $parameters = []): string
    {
        return URL::temporarySignedRoute('affiliation-applications.'.$action, now()->addHour(), ['application' => $draft, ...$parameters], false);
    }

    private function headers(): array
    {
        return ['X-Affiliation-Draft-Token' => 'synthetic-legacy-token'];
    }
}
