<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('contribution_movements')
            ->where(function ($query): void {
                $query->whereNull('reference')->orWhere('reference', '');
            })
            ->orderBy('id')
            ->eachById(function (object $movement): void {
                DB::table('contribution_movements')
                    ->where('id', $movement->id)
                    ->update(['reference' => 'legacy-'.$movement->id]);
            }, 100, 'id');

        DB::table('contribution_movements')
            ->whereNull('source_row_hash')
            ->orderBy('id')
            ->eachById(function (object $movement): void {
                DB::table('contribution_movements')
                    ->where('id', $movement->id)
                    ->update(['source_row_hash' => hash('sha256', 'legacy|'.$movement->id)]);
            }, 100, 'id');

        Schema::table('contribution_movements', function (Blueprint $table): void {
            $table->string('reference', 120)->nullable(false)->change();
            $table->char('source_row_hash', 64)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('contribution_movements', function (Blueprint $table): void {
            $table->string('reference', 120)->nullable()->change();
            $table->char('source_row_hash', 64)->nullable()->change();
        });
    }
};
