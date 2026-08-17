<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('associate_id')
                ->constrained('associates')
                ->restrictOnDelete();
            $table->string('credit_line', 120);
            $table->decimal('initial_balance', 14, 2);
            $table->decimal('current_balance', 14, 2);
            $table->integer('term_months');
            $table->decimal('interest_rate', 7, 4);
            $table->decimal('installment_amount', 14, 2);
            $table->string('status', 30)->default('active');
            $table->foreignUuid('registered_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestampsTz();

            $table->index(['associate_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE credit_accounts
                ADD CONSTRAINT credit_accounts_initial_balance_nonnegative_check
                CHECK (initial_balance >= 0)
            SQL);
            DB::statement(<<<'SQL'
                ALTER TABLE credit_accounts
                ADD CONSTRAINT credit_accounts_current_balance_nonnegative_check
                CHECK (current_balance >= 0)
            SQL);
            DB::statement(<<<'SQL'
                ALTER TABLE credit_accounts
                ADD CONSTRAINT credit_accounts_term_months_positive_check
                CHECK (term_months > 0)
            SQL);
            DB::statement(<<<'SQL'
                ALTER TABLE credit_accounts
                ADD CONSTRAINT credit_accounts_interest_rate_nonnegative_check
                CHECK (interest_rate >= 0)
            SQL);
            DB::statement(<<<'SQL'
                ALTER TABLE credit_accounts
                ADD CONSTRAINT credit_accounts_installment_amount_nonnegative_check
                CHECK (installment_amount >= 0)
            SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_accounts');
    }
};
