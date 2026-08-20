<?php

namespace Tests\Feature;

use App\Application\Affiliation\Exceptions\CannotRegisterApplicationDocument;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Domain\Affiliation\Enums\AffiliationAuditAction;
use App\Domain\Affiliation\Enums\ApplicationDocumentStatus;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Audit\Enums\AuditModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RegisterApplicationDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_registers_application_document_metadata_with_private_storage_key_and_audit_event(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $actor = User::factory()->create();
        $uploadedAt = now('UTC')->startOfSecond();
        $correlationId = (string) Str::uuid();
        $ipHash = hash('sha256', '192.0.2.40');

        $document = app(RegisterApplicationDocument::class)(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'cedula.pdf',
            mimeType: 'application/pdf',
            byteSize: 2048,
            actor: $actor,
            correlationId: $correlationId,
            ipHash: $ipHash,
            uploadedAt: $uploadedAt,
        );

        $this->assertTrue($document->application->is($application));
        $this->assertSame(ApplicationDocumentType::Identity->value, $document->document_type);
        $this->assertSame(ApplicationDocumentStatus::Uploaded->value, $document->status);
        $this->assertSame(2048, $document->byte_size);
        $this->assertTrue($uploadedAt->equalTo($document->uploaded_at));
        $this->assertStringStartsWith(
            "affiliation-applications/{$application->id}/documents/identity/",
            $document->getAttribute('storage_key'),
        );
        $this->assertArrayNotHasKey('storage_key', $document->toArray());

        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $actor->id,
            'module' => AuditModule::Affiliation->value,
            'action' => AffiliationAuditAction::DocumentUploaded->value,
            'subject_type' => 'application_document',
            'subject_id' => $document->id,
            'correlation_id' => $correlationId,
            'ip_hash' => $ipHash,
        ]);
    }

    public function test_it_archives_previous_document_of_the_same_type_when_replacing_it(): void
    {
        $application = app(CreateAffiliationDraft::class)();
        $useCase = app(RegisterApplicationDocument::class);

        $first = $useCase(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'cedula-v1.pdf',
            mimeType: 'application/pdf',
            byteSize: 1024,
        );

        $second = $useCase(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'cedula-v2.pdf',
            mimeType: 'application/pdf',
            byteSize: 2048,
        );

        $this->assertSame(ApplicationDocumentStatus::Archived->value, $first->refresh()->status);
        $this->assertSame(ApplicationDocumentStatus::Uploaded->value, $second->status);
        $this->assertSame(2, $application->documents()->where('document_type', ApplicationDocumentType::Identity->value)->count());
    }

    public function test_it_rejects_invalid_byte_size(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $this->expectException(CannotRegisterApplicationDocument::class);

        app(RegisterApplicationDocument::class)(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'cedula.pdf',
            mimeType: 'application/pdf',
            byteSize: 0,
        );
    }

    public function test_it_rejects_invalid_mime_type(): void
    {
        $application = app(CreateAffiliationDraft::class)();

        $this->expectException(CannotRegisterApplicationDocument::class);

        app(RegisterApplicationDocument::class)(
            application: $application,
            documentType: ApplicationDocumentType::Identity,
            originalFilename: 'cedula.exe',
            mimeType: 'application/x-msdownload',
            byteSize: 1024,
        );
    }
}
