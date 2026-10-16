<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->decimal('interest_rate_nominal_annual', 7, 4)->nullable()->after('interest_rate');
        });
    }

    public function down(): void
    {
        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->dropColumn('interest_rate_nominal_annual');
        });
    }
};
