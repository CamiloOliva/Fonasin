<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Affiliation\UseCases\VerifyRequiredSections;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifyRequiredSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reports_all_required_sections_as_missing_when_none_are_completed(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $verification = app(VerifyRequiredSections::class);

        $this->assertFalse($verification($application));
        $this->assertSame(
            AffiliationApplicationStep::formSections(),
            $verification->missingSections($application),
        );
    }

    public function test_it_reports_only_incomplete_sections_as_missing(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: ['section' => 'personal'],
            completedAt: now(),
        );

        $verification = app(VerifyRequiredSections::class);

        $this->assertFalse($verification($application));
        $this->assertSame([
            AffiliationApplicationStep::Employment,
            AffiliationApplicationStep::Financial,
            AffiliationApplicationStep::Beneficiaries,
            AffiliationApplicationStep::Sarlaft,
        ], $verification->missingSections($application));
    }

    public function test_it_accepts_an_application_with_all_required_sections_completed(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $saveSection = app(SaveApplicationSection::class);

        foreach (AffiliationApplicationStep::formSections() as $section) {
            $saveSection(
                application: $application,
                section: $section,
                schemaVersion: 1,
                data: ['section' => $section->value],
                completedAt: now(),
            );
        }

        $verification = app(VerifyRequiredSections::class);

        $this->assertTrue($verification($application));
        $this->assertSame([], $verification->missingSections($application));
    }
}
