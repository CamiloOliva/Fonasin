<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_corrections', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('application_id')->constrained('affiliation_applications');
            $table->foreignUuid('requested_by_user_id')->constrained('users');
            $table->text('reason_encrypted');
            $table->timestampTz('expires_at');
            $table->timestampTz('revoked_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->index(['application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_corrections');
    }
};
