<?php

namespace Tests\Feature;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaveApplicationSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_encrypts_plain_application_section_data_before_persisting_it(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $completedAt = now()->startOfSecond();
        $plainData = [
            'document_number' => '123456789',
            'full_name' => 'Synthetic Test Person',
        ];

        $section = app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $plainData,
            completedAt: $completedAt,
        );

        $this->assertTrue($section->application->is($application));
        $this->assertSame(AffiliationApplicationStep::Personal->value, $section->section);
        $this->assertSame(1, $section->schema_version);
        $this->assertNotSame(json_encode($plainData), $section->getAttribute('data_encrypted'));
        $this->assertStringNotContainsString('123456789', $section->getAttribute('data_encrypted'));
        $this->assertSame($plainData, app(EncryptsSensitiveData::class)->decryptArray($section->getAttribute('data_encrypted')));
        $this->assertTrue($completedAt->equalTo($section->completed_at));
        $this->assertSame(AffiliationApplicationStep::Personal->value, $application->refresh()->current_step);

        $this->assertDatabaseHas('application_sections', [
            'id' => $section->id,
            'application_id' => $application->id,
            'section' => AffiliationApplicationStep::Personal->value,
            'schema_version' => 1,
        ]);
    }

    public function test_it_updates_an_existing_application_section_instead_of_duplicating_it(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $useCase = app(SaveApplicationSection::class);

        $first = $useCase(
            application: $application,
            section: AffiliationApplicationStep::Financial,
            schemaVersion: 1,
            data: ['income' => 1000000],
        );
        $second = $useCase(
            application: $application,
            section: AffiliationApplicationStep::Financial,
            schemaVersion: 2,
            data: ['income' => 2000000],
        );

        $this->assertTrue($first->is($second));
        $this->assertSame(1, $application->sections()->where('section', AffiliationApplicationStep::Financial->value)->count());
        $this->assertSame(2, $second->schema_version);
        $this->assertSame(['income' => 2000000], app(EncryptsSensitiveData::class)->decryptArray($second->getAttribute('data_encrypted')));
    }

    public function test_it_rejects_steps_that_are_not_form_sections(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $this->expectException(CannotSaveApplicationSection::class);

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Documents,
            schemaVersion: 1,
            data: ['document' => 'not-a-section'],
        );
    }
}
