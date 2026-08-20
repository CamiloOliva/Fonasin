<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consent_records', function (Blueprint $table) {
            $table->unique(
                ['application_id', 'consent_type', 'policy_version'],
                'consent_records_application_type_version_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('consent_records', function (Blueprint $table) {
            $table->dropUnique('consent_records_application_type_version_unique');
        });
    }
};
