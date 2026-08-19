<?php

namespace App\Application\Affiliation\UseCases;

use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\AffiliationApplication;

class VerifyRequiredSections
{
    public function __invoke(AffiliationApplication $application): bool
    {
        return $this->missingSections($application) === [];
    }

    /**
     * @return list<AffiliationApplicationStep>
     */
    public function missingSections(AffiliationApplication $application): array
    {
        $completedSections = $application->sections()
            ->whereNotNull('completed_at')
            ->pluck('section')
            ->all();

        return array_values(array_filter(
            AffiliationApplicationStep::formSections(),
            fn (AffiliationApplicationStep $section): bool => ! in_array($section->value, $completedSections, true),
        ));
    }
}
