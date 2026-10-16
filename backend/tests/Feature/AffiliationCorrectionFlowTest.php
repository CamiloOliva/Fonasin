<?php

namespace Tests\Feature;

use App\Application\Affiliation\Contracts\DeliversAffiliationCorrections;
use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Mail\AffiliationCorrectionMail;
use App\Models\AffiliationApplication;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Support\AffiliationSectionPayloads;
use Tests\TestCase;

class AffiliationCorrectionFlowTest extends TestCase
{
    use AffiliationSectionPayloads, RefreshDatabase;

    private function prepareSubmittedApplication(): array
    {
        Mail::fake();
        Storage::fake('local');
        $draft = $this->postJson('/affiliation-applications')->assertCreated()->json('data');
        $application = AffiliationApplication::query()->findOrFail($draft['id']);
        foreach (AffiliationApplicationStep::formSections() as $step) {
            app(SaveApplicationSection::class)($application, $step, 1, $this->validSectionPayload($step), now());
        }
        foreach (ApplicationDocumentType::requiredForSubmission() as $type) {
            app(RegisterApplicationDocument::class)(
                $application, $type, $type->value.'.pdf', 'application/pdf', 20,
                fileContents: '%PDF-1.4 synthetic',
            );
        }
        foreach (ConsentType::requiredForSubmission() as $type) {
            app(AcceptApplicationConsent::class)($application, $type, 'test-v1');
        }
        $this->postJson($draft['links']['submit'], ['policy_version' => 'test-v1'], [
            'X-Affiliation-Draft-Token' => $draft['draft_access_token'],
        ])->assertOk();
        $reviewer = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $reviewer->roles()->attach(Role::query()->firstOrCreate(['name' => 'reviewer']));
        $this->actingAs($reviewer)->postJson('/admin/affiliation-applications/'.$application->id.'/review')->assertOk();

        return [$application, $reviewer, $draft];
    }

    private function invite(AffiliationApplication $application): array
    {
        $this->postJson('/admin/affiliation-applications/'.$application->id.'/correction', [
            'reason' => 'Corrige la direccion de residencia.',
        ])->assertOk()->assertJsonMissingPath('data.draft_access_token');
        $mail = Mail::sent(AffiliationCorrectionMail::class)->last();
        $this->assertNotNull($mail);
        parse_str(parse_url($mail->correctionUrl, PHP_URL_FRAGMENT), $invitation);

        return $invitation;
    }

    public function test_initial_applicant_corrects_and_resubmits_same_application_with_private_history(): void
    {
        [$application, $reviewer, $oldDraft] = $this->prepareSubmittedApplication();
        $invitation = $this->invite($application);
        auth()->logout();
        $headers = ['X-Affiliation-Draft-Token' => $invitation['token']];
        $this->getJson($oldDraft['links']['read'], ['X-Affiliation-Draft-Token' => $oldDraft['draft_access_token']])->assertForbidden();
        $this->getJson($invitation['read'])->assertForbidden();
        $draft = $this->getJson($invitation['read'], $headers)->assertOk()
            ->assertJsonPath('data.correction.reason', 'Corrige la direccion de residencia.')
            ->assertJsonPath('data.id', $application->id)->json('data');
        $personal = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $personal['residenceAddress'] = 'Direccion sintetica corregida';
        $this->postJson($draft['links']['sections']['personal'], [
            'schema_version' => 1, 'completed' => true, 'data' => $personal,
        ], $headers)->assertOk();
        $this->postJson($draft['links']['submit'], ['policy_version' => 'test-v1'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.id', $application->id);
        $this->getJson($invitation['read'], $headers)->assertStatus(409);
        $this->assertDatabaseCount('affiliation_applications', 1);
        $correction = $application->corrections()->firstOrFail();
        $this->assertNotNull($correction->completed_at);
        $this->assertStringNotContainsString('Corrige la direccion', $correction->getRawOriginal('reason_encrypted'));
        $this->assertSame('Direccion sintetica corregida', app(EncryptsSensitiveData::class)->decryptArray(
            $application->sections()->where('section', 'personal')->firstOrFail()->getAttribute('data_encrypted'),
        )['residenceAddress']);
        $this->assertDatabaseHas('audit_events', ['subject_id' => $application->id, 'metadata->status->from' => 'pending_correction']);
        $this->assertNotNull($reviewer->id);
    }

    public function test_expired_correction_is_denied_and_reissue_rotates_token_without_erasing_history(): void
    {
        [$application, $reviewer] = $this->prepareSubmittedApplication();
        $first = $this->invite($application);
        auth()->logout();
        $this->travel(25)->hours();
        $this->getJson($first['read'], ['X-Affiliation-Draft-Token' => $first['token']])->assertForbidden();
        $this->actingAs($reviewer);
        $second = $this->invite($application);
        auth()->logout();
        $this->assertNotSame($first['token'], $second['token']);
        $this->getJson($second['read'], ['X-Affiliation-Draft-Token' => $first['token']])->assertForbidden();
        $this->getJson($second['read'], ['X-Affiliation-Draft-Token' => $second['token']])->assertOk();
        $this->assertSame(2, $application->corrections()->count());
        $this->assertSame(1, $application->corrections()->whereNotNull('revoked_at')->count());
    }

    public function test_correction_mail_failure_rolls_back_state_token_and_history(): void
    {
        [$application] = $this->prepareSubmittedApplication();
        $this->app->instance(DeliversAffiliationCorrections::class,
            new class implements DeliversAffiliationCorrections
            {
                public function send(AffiliationApplication $application, string $email, string $token, Carbon $expiresAt): void
                {
                    throw new \DomainException('No fue posible enviar el enlace. Intenta nuevamente.');
                }
            });
        $this->postJson('/admin/affiliation-applications/'.$application->id.'/correction', ['reason' => 'Corrige la direccion.'])->assertUnprocessable();
        $this->assertSame('under_review', $application->fresh()->status);
        $this->assertNull($application->fresh()->access_token_hash);
        $this->assertSame(0, $application->corrections()->count());
    }

    public function test_private_profile_correction_requires_owner_and_resumes_same_request(): void
    {
        [$application, $reviewer] = $this->prepareSubmittedApplication();
        $owner = User::factory()->create(['status' => 'active', 'must_change_password' => false]);
        $owner->roles()->attach(Role::query()->firstOrCreate(['name' => 'associate']));
        $associate = Associate::query()->create([
            'user_id' => $owner->id, 'full_name' => 'Synthetic Owner', 'document_type' => 'CC', 'status' => 'active',
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('123456789'),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => '123456789']),
        ]);
        $application->forceFill(['purpose' => 'profile_completion', 'associate_id' => $associate->id])->save();
        $invitation = $this->invite($application);
        auth()->logout();
        $headers = ['X-Affiliation-Draft-Token' => $invitation['token']];
        $this->getJson($invitation['read'], $headers)->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson($invitation['read'], $headers)->assertForbidden();
        $this->actingAs($owner)->getJson($invitation['read'], $headers)->assertOk();
        $this->travel(25)->hours();
        $resumed = $this->actingAs($owner)->postJson('/portal/affiliation/update-draft')->assertCreated()
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.status', 'pending_correction')->json('data');
        $this->getJson($resumed['links']['read'], ['X-Affiliation-Draft-Token' => $resumed['draft_access_token']])
            ->assertOk()->assertJsonPath('data.correction.reason', 'Corrige la direccion de residencia.');
        $this->assertDatabaseCount('affiliation_applications', 1);
    }

    public function test_correction_archives_previous_employer_signature_without_deleting_its_evidence(): void
    {
        [$application] = $this->prepareSubmittedApplication();
        $application->forceFill(['status' => 'approved'])->save();
        $signed = app(RegisterApplicationDocument::class)(
            $application, ApplicationDocumentType::SignedPayrollAuthorization,
            'anterior.pdf', 'application/pdf', 20, fileContents: '%PDF-1.4 synthetic',
        );
        $this->invite($application);
        $this->assertSame('archived', $signed->fresh()->status);
        Storage::disk('local')->assertExists($signed->storage_key);
        $this->assertDatabaseHas('audit_events', [
            'subject_id' => $application->id, 'action' => 'application.correction_requested',
            'metadata->archived_signed_authorizations' => 1,
        ]);
    }
}
