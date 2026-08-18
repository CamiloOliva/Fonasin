<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('occurred_at')->useCurrent();
            $table->foreignUuid('user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('event_type', 80);
            $table->char('email_hash', 64)->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->char('user_agent_hash', 64)->nullable();
            $table->uuid('correlation_id')->nullable();
            $table->jsonb('metadata')->default('{}');

            $table->index(['user_id', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
            $table->index(['email_hash', 'occurred_at']);
            $table->index('correlation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_events');
    }
};
