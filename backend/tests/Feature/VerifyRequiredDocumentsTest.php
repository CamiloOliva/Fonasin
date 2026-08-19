<?php

namespace Tests\Feature;

use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\VerifyRequiredDocuments;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifyRequiredDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reports_all_required_documents_as_missing_when_none_were_uploaded(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $missing = app(VerifyRequiredDocuments::class)->missingDocumentTypes($application);

        $this->assertSame(ApplicationDocumentType::requiredForSubmission(), $missing);
    }

    public function test_it_accepts_an_application_with_all_required_documents_uploaded(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        app(RegisterApplicationDocument::class)(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'identity.pdf',
            mimeType: 'application/pdf',
            byteSize: 2048,
        );

        $this->assertTrue(app(VerifyRequiredDocuments::class)($application));
    }

    public function test_it_does_not_count_archived_documents_as_uploaded(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $document = app(RegisterApplicationDocument::class)(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'identity.pdf',
            mimeType: 'application/pdf',
            byteSize: 2048,
        );
        $document->forceFill(['status' => ApplicationDocumentStatus::Archived->value])->save();

        $missing = app(VerifyRequiredDocuments::class)->missingDocumentTypes($application);

        $this->assertSame([ApplicationDocumentType::Identity], $missing);
    }
}
