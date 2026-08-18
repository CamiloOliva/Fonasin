<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\Associate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreateAffiliationDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_public_affiliation_draft_without_an_associate(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $this->assertTrue(Str::isUuid($application->id));
        $this->assertNull($application->associate_id);
        $this->assertSame(AffiliationApplicationStatus::Draft->value, $application->status);
        $this->assertSame(AffiliationApplicationStep::Personal->value, $application->current_step);
        $this->assertNull($application->submitted_at);
        $this->assertNull($application->reviewed_by_user_id);
        $this->assertNull($application->reviewed_at);
        $this->assertNull($application->rejection_reason);

        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $application->id,
            'associate_id' => null,
            'status' => AffiliationApplicationStatus::Draft->value,
            'current_step' => AffiliationApplicationStep::Personal->value,
        ]);
    }

    public function test_it_can_attach_the_draft_to_an_existing_associate(): void
    {
        $associate = Associate::query()->create([
            'document_type' => 'test',
            'document_number_hash' => hash('sha256', (string) Str::uuid()),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Test Person',
            'status' => 'applicant',
        ]);

        $application = app(CreateAffiliationDraft::class)($associate);

        $this->assertTrue($application->associate->is($associate));
        $this->assertDatabaseHas('affiliation_applications', [
            'id' => $application->id,
            'associate_id' => $associate->id,
        ]);
    }
}
