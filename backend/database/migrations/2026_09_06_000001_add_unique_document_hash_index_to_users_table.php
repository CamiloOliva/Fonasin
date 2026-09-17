<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const INDEX_NAME = 'users_document_number_hash_unique';

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unique('document_number_hash', self::INDEX_NAME);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(self::INDEX_NAME);
        });
    }
};
