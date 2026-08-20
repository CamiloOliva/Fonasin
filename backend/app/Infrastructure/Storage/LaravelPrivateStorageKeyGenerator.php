<?php

namespace App\Infrastructure\Storage;

use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Models\AffiliationApplication;
use Illuminate\Support\Str;

class LaravelPrivateStorageKeyGenerator implements GeneratesPrivateStorageKeys
{
    public function forApplicationDocument(
        AffiliationApplication $application,
        ApplicationDocumentType $documentType,
        string $originalFilename,
    ): string {
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $filename = (string) Str::uuid();

        if ($extension !== '') {
            $filename .= '.'.Str::lower($extension);
        }

        return implode('/', [
            'affiliation-applications',
            $application->id,
            'documents',
            $documentType->value,
            $filename,
        ]);
    }

    public function forFpqrsAttachment(
        string $submissionId,
        string $originalFilename,
    ): string {
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $filename = (string) Str::uuid();

        if ($extension !== '') {
            $filename .= '.'.Str::lower($extension);
        }

        return implode('/', [
            'fpqrs-submissions',
            $submissionId,
            'attachments',
            $filename,
        ]);
    }
}
