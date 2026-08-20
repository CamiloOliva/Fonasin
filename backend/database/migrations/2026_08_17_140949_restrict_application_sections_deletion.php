<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_sections', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->foreign('application_id')
                ->references('id')
                ->on('affiliation_applications')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('application_sections', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->foreign('application_id')
                ->references('id')
                ->on('affiliation_applications')
                ->cascadeOnDelete();
        });
    }
};
