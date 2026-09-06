<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX_NAME = 'users_document_number_hash_unique';

    public function up(): void
    {
        DB::statement(sprintf(
            'CREATE UNIQUE INDEX %s ON users (document_number_hash) WHERE document_number_hash IS NOT NULL',
            self::INDEX_NAME,
        ));
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::INDEX_NAME);
    }
};
