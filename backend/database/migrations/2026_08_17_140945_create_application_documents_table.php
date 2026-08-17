<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')
                ->constrained('affiliation_applications')
                ->restrictOnDelete();
            $table->string('document_type', 50);
            $table->string('original_filename', 255);
            $table->string('storage_key', 500)->unique();
            $table->string('mime_type', 100);
            $table->bigInteger('byte_size');
            $table->string('status', 30)->default('uploaded');
            $table->timestampTz('uploaded_at')->useCurrent();
            $table->timestampsTz();

            $table->index(['application_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE application_documents
                ADD CONSTRAINT application_documents_byte_size_positive_check
                CHECK (byte_size > 0)
            SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
