<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')
                ->constrained('affiliation_applications')
                ->cascadeOnDelete();
            $table->string('section', 40);
            $table->integer('schema_version');
            $table->text('data_encrypted');
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();

            $table->unique(['application_id', 'section']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_sections');
    }
};
