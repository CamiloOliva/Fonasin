<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ACTIVE_DRAFT_INDEX = 'affiliation_applications_one_active_draft_per_associate';

    public function up(): void
    {
        Schema::table('affiliation_applications', function (Blueprint $table): void {
            $table->string('purpose', 40)->default('initial_affiliation')->index();
            $table->foreignUuid('source_application_id')
                ->nullable()
                ->constrained('affiliation_applications')
                ->restrictOnDelete();
        });

        DB::table('affiliation_applications')
            ->whereNotNull('associate_id')
            ->where('status', 'draft')
            ->update(['purpose' => 'data_update']);

        $this->rebuildActiveDraftIndex();

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE affiliation_applications
                ADD CONSTRAINT affiliation_applications_purpose_check
                CHECK (purpose IN ('initial_affiliation', 'data_update'))
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE affiliation_applications DROP CONSTRAINT IF EXISTS affiliation_applications_purpose_check');
        }

        Schema::table('affiliation_applications', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('source_application_id');
            $table->dropIndex(['purpose']);
            $table->dropColumn('purpose');
        });

        $this->rebuildActiveDraftIndex();
    }

    private function rebuildActiveDraftIndex(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::ACTIVE_DRAFT_INDEX);
        DB::statement(sprintf(
            "CREATE UNIQUE INDEX %s ON affiliation_applications (associate_id) WHERE associate_id IS NOT NULL AND status = 'draft'",
            self::ACTIVE_DRAFT_INDEX,
        ));
    }
};
