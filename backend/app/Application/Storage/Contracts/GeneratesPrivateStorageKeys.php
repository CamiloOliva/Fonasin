<?php

namespace App\Application\Storage\Contracts;

use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;

interface GeneratesPrivateStorageKeys
{
    public function forApplicationDocument(
        AffiliationApplication $application,
        ApplicationDocumentType $documentType,
        string $originalFilename,
    ): string;

    public function forFpqrsAttachment(
        string $submissionId,
        string $originalFilename,
    ): string;
}
