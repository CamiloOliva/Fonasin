<?php

namespace Tests\Feature;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use Tests\Support\AffiliationSectionPayloads;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaveApplicationSectionTest extends TestCase
{
    use RefreshDatabase;
    use AffiliationSectionPayloads;

    public function test_it_encrypts_plain_application_section_data_before_persisting_it(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $completedAt = now()->startOfSecond();
        $plainData = $this->validSectionPayload(AffiliationApplicationStep::Personal);

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
        $this->assertStringNotContainsString($plainData['documentNumber'], $section->getAttribute('data_encrypted'));
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

    public function test_it_rejects_completed_sections_with_missing_required_fields(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['documentNumber'] = '';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('numero de documento');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_invalid_document_type_on_completed_personal_section(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['documentType'] = 'Otro';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('tipo de documento');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_invalid_document_number_format_on_completed_personal_section(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['documentType'] = 'CC';
        $data['documentNumber'] = 'ABC123';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('numero de documento');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_invalid_colombian_mobile_on_completed_personal_section(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['mobile'] = '6011234567';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('celular');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_invalid_dependents_count_when_personal_section_has_dependents(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['hasDependents'] = 'Si';
        $data['dependentsCount'] = 'abc';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('numero de personas a cargo');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_allows_partial_sections_when_they_are_not_marked_completed(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $section = app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: ['documentNumber' => '123456789'],
        );

        $this->assertNull($section->completed_at);
        $this->assertSame(['documentNumber' => '123456789'], app(EncryptsSensitiveData::class)->decryptArray($section->getAttribute('data_encrypted')));
    }

    public function test_it_rejects_invalid_completed_sarlaft_conditionals(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Sarlaft);
        $data['foreignAccounts'] = 'Si';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('pais de cuenta en el exterior');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Sarlaft,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_requires_other_contract_type_detail_when_employment_uses_other(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Employment);
        $data['contractType'] = 'Otro';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('contractTypeOther');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Employment,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_requires_other_beneficiary_relationship_detail_when_relationship_uses_other(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Beneficiaries);
        $data['beneficiaries'][0]['relationship'] = 'Otro';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('relationshipOther');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Beneficiaries,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_requires_other_sarlaft_details_when_catalog_options_use_other(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Sarlaft);
        $data['incomeSource'] = ['Otro'];

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('incomeSourceOther');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Sarlaft,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_completed_sections_with_future_dates(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Employment);
        $data['hireDate'] = now()->addDay()->format('Y-m-d');

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('fecha de ingreso');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Employment,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_more_than_five_beneficiaries(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Beneficiaries);
        $data['beneficiaries'] = array_fill(0, 6, $data['beneficiaries'][0]);

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('mas de cinco beneficiarios');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Beneficiaries,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_allows_beneficiaries_without_percentage(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Beneficiaries);
        unset($data['beneficiaries'][0]['percentage']);

        $section = app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Beneficiaries,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );

        $this->assertSame(AffiliationApplicationStep::Beneficiaries->value, $section->section);
        $this->assertNotNull($section->completed_at);
    }

    public function test_it_allows_flexible_beneficiary_phone_numbers(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Beneficiaries);
        $data['beneficiaries'][0]['phone'] = '6071234';

        $section = app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Beneficiaries,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );

        $this->assertSame(AffiliationApplicationStep::Beneficiaries->value, $section->section);
    }

    public function test_it_rejects_non_mobile_emergency_contact_numbers(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Beneficiaries);
        $data['emergencyContact']['phone'] = '6071234';

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('emergencyContact.phone');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Beneficiaries,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }

    public function test_it_rejects_completed_sections_with_overlong_values(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $data = $this->validSectionPayload(AffiliationApplicationStep::Personal);
        $data['firstName'] = str_repeat('A', 81);

        $this->expectException(CannotSaveApplicationSection::class);
        $this->expectExceptionMessage('primer nombre');

        app(SaveApplicationSection::class)(
            application: $application,
            section: AffiliationApplicationStep::Personal,
            schemaVersion: 1,
            data: $data,
            completedAt: now(),
        );
    }
}
