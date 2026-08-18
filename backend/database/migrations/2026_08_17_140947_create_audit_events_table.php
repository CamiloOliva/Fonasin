<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('occurred_at')->useCurrent();
            $table->foreignUuid('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('actor_type', 20);
            $table->string('module', 40);
            $table->string('action', 80);
            $table->string('subject_type', 80);
            $table->uuid('subject_id');
            $table->uuid('correlation_id')->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->jsonb('metadata')->default('{}');

            $table->index(['subject_type', 'subject_id', 'occurred_at']);
            $table->index(['actor_user_id', 'occurred_at']);
            $table->index(['module', 'action', 'occurred_at']);
            $table->index('correlation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
    }
};
