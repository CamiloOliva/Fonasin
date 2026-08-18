<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consent_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')
                ->constrained('affiliation_applications')
                ->restrictOnDelete();
            $table->string('consent_type', 50);
            $table->string('policy_version', 50);
            $table->timestampTz('accepted_at');
            $table->char('ip_hash', 64)->nullable();
            $table->timestampsTz();

            $table->index(['application_id', 'consent_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_records');
    }
};
