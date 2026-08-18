<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SaveApplicationSection
{
    public function __invoke(
        AffiliationApplication $application,
        AffiliationApplicationStep $section,
        int $schemaVersion,
        string $dataEncrypted,
        ?Carbon $completedAt = null,
    ): ApplicationSection {
        if (! $section->isFormSection()) {
            throw CannotSaveApplicationSection::unsupportedSection($section->value);
        }

        return DB::transaction(function () use ($application, $section, $schemaVersion, $dataEncrypted, $completedAt) {
            $applicationSection = ApplicationSection::query()->firstOrNew([
                'application_id' => $application->id,
                'section' => $section->value,
            ]);

            $applicationSection->forceFill([
                'schema_version' => $schemaVersion,
                'data_encrypted' => $dataEncrypted,
                'completed_at' => $completedAt,
            ]);

            $applicationSection->save();

            $application->forceFill([
                'current_step' => $section->value,
            ])->save();

            return $applicationSection;
        });
    }
}
