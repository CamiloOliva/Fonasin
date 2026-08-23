<?php

namespace App\Application\Affiliation\UseCases;

use App\Application\Affiliation\Exceptions\CannotSaveApplicationSection;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Support\AffiliationSectionPayloadValidator;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SaveApplicationSection
{
    public function __construct(
        private readonly EncryptsSensitiveData $cipher,
        private readonly AffiliationSectionPayloadValidator $validator,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function __invoke(
        AffiliationApplication $application,
        AffiliationApplicationStep $section,
        int $schemaVersion,
        array $data,
        ?Carbon $completedAt = null,
    ): ApplicationSection {
        if (! $section->isFormSection()) {
            throw CannotSaveApplicationSection::unsupportedSection($section->value);
        }

        if ($completedAt !== null) {
            $this->validator->validateCompleted($section, $data);
        }

        return DB::transaction(function () use ($application, $section, $schemaVersion, $data, $completedAt) {
            $applicationSection = ApplicationSection::query()->firstOrNew([
                'application_id' => $application->id,
                'section' => $section->value,
            ]);

            $applicationSection->forceFill([
                'schema_version' => $schemaVersion,
                'data_encrypted' => $this->cipher->encryptArray($data),
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
