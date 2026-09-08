<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('imported_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('import_type', 40);
            $table->string('original_filename', 255);
            $table->string('storage_key', 500);
            $table->char('file_hash', 64);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('byte_size');
            $table->string('status', 40)->default('pending');
            $table->unsignedInteger('rows_total')->default(0);
            $table->unsignedInteger('rows_created')->default(0);
            $table->unsignedInteger('rows_updated')->default(0);
            $table->unsignedInteger('rows_rejected')->default(0);
            $table->jsonb('errors')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();

            $table->index(['import_type', 'status', 'created_at']);
            $table->unique(['import_type', 'file_hash']);
        });

        Schema::create('contribution_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('associate_id')
                ->unique()
                ->constrained('associates')
                ->restrictOnDelete();
            $table->decimal('permanent_savings_balance', 14, 2)->default(0);
            $table->decimal('voluntary_savings_balance', 14, 2)->default(0);
            $table->decimal('total_balance', 14, 2)->default(0);
            $table->string('status', 30)->default('active');
            $table->date('last_period')->nullable();
            $table->date('last_cut_off_date')->nullable();
            $table->timestampTz('last_movement_at')->nullable();
            $table->timestampsTz();

            $table->index(['associate_id', 'status']);
        });

        Schema::create('contribution_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contribution_account_id')
                ->constrained('contribution_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('associate_id')
                ->constrained('associates')
                ->restrictOnDelete();
            $table->foreignUuid('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();
            $table->foreignUuid('recorded_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('movement_type', 40);
            $table->date('period');
            $table->date('cut_off_date');
            $table->decimal('amount', 14, 2);
            $table->decimal('balance_after', 14, 2);
            $table->string('status', 30)->default('registered');
            $table->string('source', 30)->default('manual');
            $table->string('reference', 120)->nullable();
            $table->char('source_row_hash', 64)->nullable();
            $table->timestampTz('recorded_at');
            $table->timestampsTz();

            $table->index(['associate_id', 'period']);
            $table->index(['contribution_account_id', 'recorded_at']);
            $table->unique(['associate_id', 'movement_type', 'period', 'source_row_hash']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE contribution_accounts
                ADD CONSTRAINT contribution_accounts_balances_nonnegative_check
                CHECK (
                    permanent_savings_balance >= 0
                    AND voluntary_savings_balance >= 0
                    AND total_balance >= 0
                )
            SQL);

            DB::statement(<<<'SQL'
                ALTER TABLE contribution_movements
                ADD CONSTRAINT contribution_movements_amount_nonnegative_check
                CHECK (amount >= 0 AND balance_after >= 0)
            SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contribution_movements');
        Schema::dropIfExists('contribution_accounts');
        Schema::dropIfExists('import_batches');
    }
};
