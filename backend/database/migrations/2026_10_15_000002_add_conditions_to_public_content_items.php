<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('public_content_items', function (Blueprint $table): void {
            $table->text('conditions')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('public_content_items', function (Blueprint $table): void {
            $table->dropColumn('conditions');
        });
    }
};
