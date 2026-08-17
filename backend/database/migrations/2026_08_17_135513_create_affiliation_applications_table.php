<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliation_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('associate_id')
                ->nullable()
                ->constrained('associates')
                ->restrictOnDelete();
            $table->string('status', 30)->default('draft');
            $table->string('current_step', 30)->nullable();
            $table->timestampTz('submitted_at')->nullable();
            $table->foreignUuid('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestampTz('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestampsTz();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliation_applications');
    }
};
