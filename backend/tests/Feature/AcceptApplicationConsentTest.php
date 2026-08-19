<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Domain\Affiliation\Enums\ConsentType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcceptApplicationConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_records_an_application_consent_acceptance(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $acceptedAt = now()->startOfSecond();
        $ipHash = hash('sha256', '192.0.2.10');

        $consent = app(AcceptApplicationConsent::class)(
            application: $application,
            consentType: ConsentType::DataProcessing,
            policyVersion: '2026-01',
            ipHash: $ipHash,
            acceptedAt: $acceptedAt,
        );

        $this->assertTrue($consent->application->is($application));
        $this->assertSame(ConsentType::DataProcessing->value, $consent->consent_type);
        $this->assertSame('2026-01', $consent->policy_version);
        $this->assertTrue($acceptedAt->equalTo($consent->accepted_at));
        $this->assertSame($ipHash, $consent->getAttribute('ip_hash'));
        $this->assertArrayNotHasKey('ip_hash', $consent->toArray());

        $this->assertDatabaseHas('consent_records', [
            'id' => $consent->id,
            'application_id' => $application->id,
            'consent_type' => ConsentType::DataProcessing->value,
            'policy_version' => '2026-01',
            'ip_hash' => $ipHash,
        ]);
    }

    public function test_it_is_idempotent_for_the_same_application_type_and_policy_version(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $useCase = app(AcceptApplicationConsent::class);

        $first = $useCase(
            application: $application,
            consentType: ConsentType::Bylaws,
            policyVersion: '2026-01',
            ipHash: hash('sha256', '192.0.2.11'),
            acceptedAt: now()->subMinute()->startOfSecond(),
        );
        $second = $useCase(
            application: $application,
            consentType: ConsentType::Bylaws,
            policyVersion: '2026-01',
            ipHash: hash('sha256', '192.0.2.12'),
            acceptedAt: now()->startOfSecond(),
        );

        $this->assertTrue($first->is($second));
        $this->assertSame(1, $application->consentRecords()->where('consent_type', ConsentType::Bylaws->value)->count());
        $this->assertSame($first->getAttribute('ip_hash'), $second->getAttribute('ip_hash'));
    }

    public function test_it_allows_a_new_consent_for_a_new_policy_version(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $useCase = app(AcceptApplicationConsent::class);

        $useCase($application, ConsentType::DataProcessing, '2026-01');
        $useCase($application, ConsentType::DataProcessing, '2026-02');

        $this->assertSame(2, $application->consentRecords()->where('consent_type', ConsentType::DataProcessing->value)->count());
    }
}
