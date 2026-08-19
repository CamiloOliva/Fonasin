<?php

namespace App\Application\Affiliation\UseCases;

use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;

class VerifyRequiredDocuments
{
    public function __invoke(AffiliationApplication $application): bool
    {
        return $this->missingDocumentTypes($application) === [];
    }

    /**
     * @return list<ApplicationDocumentType>
     */
    public function missingDocumentTypes(AffiliationApplication $application): array
    {
        $uploadedDocumentTypes = $application->documents()
            ->where('status', ApplicationDocumentStatus::Uploaded->value)
            ->pluck('document_type')
            ->all();

        return array_values(array_filter(
            ApplicationDocumentType::requiredForSubmission(),
            fn (ApplicationDocumentType $documentType): bool => ! in_array($documentType->value, $uploadedDocumentTypes, true),
        ));
    }
}
