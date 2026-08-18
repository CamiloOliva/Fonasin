<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('associates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->nullable()
                ->unique()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('document_type', 20);
            $table->char('document_number_hash', 64)->unique();
            $table->text('document_number_encrypted');
            $table->string('full_name', 255);
            $table->string('status', 30)->default('applicant');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('associates');
    }
};
