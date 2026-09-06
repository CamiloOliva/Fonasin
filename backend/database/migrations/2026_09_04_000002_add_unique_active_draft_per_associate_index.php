<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX_NAME = 'affiliation_applications_one_active_draft_per_associate';
    private const DRAFT_STATUS = 'draft';
    private const CANCELLED_STATUS = 'cancelled';

    public function up(): void
    {
        $this->cancelDuplicateDrafts();

        DB::statement(sprintf(
            "CREATE UNIQUE INDEX %s ON affiliation_applications (associate_id) WHERE associate_id IS NOT NULL AND status = '%s'",
            self::INDEX_NAME,
            self::DRAFT_STATUS,
        ));
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::INDEX_NAME);
    }

    private function cancelDuplicateDrafts(): void
    {
        DB::table('affiliation_applications')
            ->select('associate_id')
            ->whereNotNull('associate_id')
            ->where('status', self::DRAFT_STATUS)
            ->groupBy('associate_id')
            ->havingRaw('COUNT(*) > 1')
            ->orderBy('associate_id')
            ->chunk(100, function ($duplicates): void {
                foreach ($duplicates as $duplicate) {
                    $draftsToCancel = DB::table('affiliation_applications')
                        ->where('associate_id', $duplicate->associate_id)
                        ->where('status', self::DRAFT_STATUS)
                        ->orderByDesc('updated_at')
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->skip(1)
                        ->pluck('id')
                        ->all();

                    if ($draftsToCancel === []) {
                        continue;
                    }

                    DB::table('affiliation_applications')
                        ->whereIn('id', $draftsToCancel)
                        ->update([
                            'status' => self::CANCELLED_STATUS,
                            'access_token_hash' => null,
                            'updated_at' => now(),
                        ]);
                }
            });
    }
};
