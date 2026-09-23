<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voluntary_savings_requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('associate_id')->constrained()->restrictOnDelete();
            $table->decimal('monthly_amount', 15, 2);
            $table->string('status', 40)->default('submitted');
            $table->string('authorization_storage_key', 500);
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignUuid('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['associate_id', 'submitted_at']);
            $table->index(['status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voluntary_savings_requests');
    }
};
