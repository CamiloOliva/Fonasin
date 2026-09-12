<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->char('promissory_note_number_hash', 64)->nullable()->unique();
            $table->text('promissory_note_number_encrypted')->nullable();
            $table->date('last_payment_date')->nullable();
            $table->integer('term_months')->nullable()->change();
            $table->decimal('interest_rate', 7, 4)->nullable()->change();
        });

        Schema::table('contribution_accounts', function (Blueprint $table): void {
            $table->decimal('contribution_balance', 14, 2)->default(0);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE contribution_accounts
                ADD CONSTRAINT contribution_accounts_contribution_balance_nonnegative_check
                CHECK (contribution_balance >= 0)
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE contribution_accounts DROP CONSTRAINT IF EXISTS contribution_accounts_contribution_balance_nonnegative_check');
        }

        Schema::table('contribution_accounts', function (Blueprint $table): void {
            $table->dropColumn('contribution_balance');
        });

        DB::table('credit_accounts')->whereNull('term_months')->update(['term_months' => 1]);
        DB::table('credit_accounts')->whereNull('interest_rate')->update(['interest_rate' => 0]);

        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->dropUnique(['promissory_note_number_hash']);
            $table->dropColumn([
                'promissory_note_number_hash',
                'promissory_note_number_encrypted',
                'last_payment_date',
            ]);
            $table->integer('term_months')->nullable(false)->change();
            $table->decimal('interest_rate', 7, 4)->nullable(false)->change();
        });
    }
};
