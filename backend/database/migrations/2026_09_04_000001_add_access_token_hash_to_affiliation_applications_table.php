<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliation_applications', function (Blueprint $table): void {
            $table->string('access_token_hash', 64)->nullable()->after('current_step');
        });
    }

    public function down(): void
    {
        Schema::table('affiliation_applications', function (Blueprint $table): void {
            $table->dropColumn('access_token_hash');
        });
    }
};
