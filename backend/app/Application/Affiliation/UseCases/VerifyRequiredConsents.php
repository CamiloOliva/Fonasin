<?php

namespace App\Application\Affiliation\UseCases;

use App\Domain\Affiliation\Enums\ConsentType;
use App\Models\AffiliationApplication;

class VerifyRequiredConsents
{
    public function __invoke(AffiliationApplication $application, string $policyVersion): bool
    {
        return $this->missingConsentTypes($application, $policyVersion) === [];
    }

    /**
     * @return list<ConsentType>
     */
    public function missingConsentTypes(AffiliationApplication $application, string $policyVersion): array
    {
        $acceptedTypes = $application->consentRecords()
            ->where('policy_version', $policyVersion)
            ->pluck('consent_type')
            ->all();

        return array_values(array_filter(
            ConsentType::requiredForSubmission(),
            fn (ConsentType $consentType): bool => ! in_array($consentType->value, $acceptedTypes, true),
        ));
    }
}
