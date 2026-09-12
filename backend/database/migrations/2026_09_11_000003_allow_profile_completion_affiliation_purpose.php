<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE affiliation_applications DROP CONSTRAINT IF EXISTS affiliation_applications_purpose_check');
        DB::statement(<<<'SQL'
            ALTER TABLE affiliation_applications
            ADD CONSTRAINT affiliation_applications_purpose_check
            CHECK (purpose IN ('initial_affiliation', 'data_update', 'profile_completion'))
        SQL);
    }

    public function down(): void
    {
        DB::table('affiliation_applications')
            ->where('purpose', 'profile_completion')
            ->update(['purpose' => 'data_update']);

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE affiliation_applications DROP CONSTRAINT IF EXISTS affiliation_applications_purpose_check');
        DB::statement(<<<'SQL'
            ALTER TABLE affiliation_applications
            ADD CONSTRAINT affiliation_applications_purpose_check
            CHECK (purpose IN ('initial_affiliation', 'data_update'))
        SQL);
    }
};
