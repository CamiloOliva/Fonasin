<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\VerifyRequiredConsents;
use App\Domain\Affiliation\Enums\ConsentType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifyRequiredConsentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reports_all_required_consents_as_missing_when_none_were_accepted(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $verification = app(VerifyRequiredConsents::class);

        $this->assertFalse($verification($application, '2026-01'));
        $this->assertSame(
            ConsentType::requiredForSubmission(),
            $verification->missingConsentTypes($application, '2026-01'),
        );
    }

    public function test_it_reports_only_the_missing_required_consent(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        app(AcceptApplicationConsent::class)(
            application: $application,
            consentType: ConsentType::DataProcessing,
            policyVersion: '2026-01',
        );

        $verification = app(VerifyRequiredConsents::class);

        $this->assertFalse($verification($application, '2026-01'));
        $this->assertSame([ConsentType::Bylaws], $verification->missingConsentTypes($application, '2026-01'));
    }

    public function test_it_accepts_an_application_with_all_required_consents_for_the_policy_version(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $acceptConsent = app(AcceptApplicationConsent::class);

        $acceptConsent($application, ConsentType::DataProcessing, '2026-01');
        $acceptConsent($application, ConsentType::Bylaws, '2026-01');

        $verification = app(VerifyRequiredConsents::class);

        $this->assertTrue($verification($application, '2026-01'));
        $this->assertSame([], $verification->missingConsentTypes($application, '2026-01'));
    }

    public function test_it_requires_consents_for_the_requested_policy_version(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $acceptConsent = app(AcceptApplicationConsent::class);

        $acceptConsent($application, ConsentType::DataProcessing, '2026-01');
        $acceptConsent($application, ConsentType::Bylaws, '2026-01');

        $verification = app(VerifyRequiredConsents::class);

        $this->assertFalse($verification($application, '2026-02'));
        $this->assertSame(
            ConsentType::requiredForSubmission(),
            $verification->missingConsentTypes($application, '2026-02'),
        );
    }
}
