<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voluntary_savings_requests', function (Blueprint $table): void {
            $table->foreignUuid('pending_associate_id')
                ->nullable()
                ->after('associate_id')
                ->constrained('associates')
                ->restrictOnDelete();
        });

        DB::statement("UPDATE voluntary_savings_requests SET pending_associate_id = associate_id WHERE status = 'submitted'");

        Schema::table('voluntary_savings_requests', function (Blueprint $table): void {
            $table->unique('pending_associate_id', 'voluntary_savings_one_pending_per_associate');
        });
    }

    public function down(): void
    {
        Schema::table('voluntary_savings_requests', function (Blueprint $table): void {
            $table->dropUnique('voluntary_savings_one_pending_per_associate');
            $table->dropConstrainedForeignId('pending_associate_id');
        });
    }
};
