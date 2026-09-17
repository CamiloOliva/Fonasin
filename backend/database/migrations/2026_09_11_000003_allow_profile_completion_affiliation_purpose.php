<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['pgsql', 'mariadb'], true)) {
            return;
        }

        $this->dropPurposeConstraint();
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

        if (! in_array(DB::getDriverName(), ['pgsql', 'mariadb'], true)) {
            return;
        }

        $this->dropPurposeConstraint();
        DB::statement(<<<'SQL'
            ALTER TABLE affiliation_applications
            ADD CONSTRAINT affiliation_applications_purpose_check
            CHECK (purpose IN ('initial_affiliation', 'data_update'))
        SQL);
    }

    private function dropPurposeConstraint(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE affiliation_applications DROP CONSTRAINT IF EXISTS affiliation_applications_purpose_check');

            return;
        }

        DB::statement('ALTER TABLE affiliation_applications DROP CONSTRAINT affiliation_applications_purpose_check');
    }
};
