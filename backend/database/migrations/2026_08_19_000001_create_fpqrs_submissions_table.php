<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fpqrs_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name', 255);
            $table->string('email', 255);
            $table->char('email_hash', 64)->index();
            $table->string('submission_type', 40);
            $table->text('message');
            $table->string('attachment_original_filename', 255)->nullable();
            $table->string('attachment_storage_key', 500)->nullable();
            $table->string('attachment_mime_type', 100)->nullable();
            $table->unsignedBigInteger('attachment_byte_size')->nullable();
            $table->string('delivery_status', 30)->default('pending');
            $table->timestampTz('submitted_at');
            $table->char('ip_hash', 64)->nullable();
            $table->timestampsTz();

            $table->index(['submission_type', 'submitted_at']);
            $table->index(['delivery_status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fpqrs_submissions');
    }
};
