<?php

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX_NAME = 'affiliation_applications_one_active_draft_per_associate';

    public function up(): void
    {
        $this->cancelDuplicateDrafts();

        DB::statement(sprintf(
            "CREATE UNIQUE INDEX %s ON affiliation_applications (associate_id) WHERE associate_id IS NOT NULL AND status = '%s'",
            self::INDEX_NAME,
            AffiliationApplicationStatus::Draft->value,
        ));
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::INDEX_NAME);
    }

    private function cancelDuplicateDrafts(): void
    {
        $draftStatus = AffiliationApplicationStatus::Draft->value;
        $cancelledStatus = AffiliationApplicationStatus::Cancelled->value;

        DB::table('affiliation_applications')
            ->select('associate_id')
            ->whereNotNull('associate_id')
            ->where('status', $draftStatus)
            ->groupBy('associate_id')
            ->havingRaw('COUNT(*) > 1')
            ->orderBy('associate_id')
            ->chunk(100, function ($duplicates) use ($draftStatus, $cancelledStatus): void {
                foreach ($duplicates as $duplicate) {
                    $draftsToCancel = DB::table('affiliation_applications')
                        ->where('associate_id', $duplicate->associate_id)
                        ->where('status', $draftStatus)
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
                            'status' => $cancelledStatus,
                            'access_token_hash' => null,
                            'updated_at' => now(),
                        ]);
                }
            });
    }
};
