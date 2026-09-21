<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('document_type', 30)->nullable()->after('email');
            $table->char('document_number_hash', 64)->nullable()->after('document_type');
            $table->text('document_number_encrypted')->nullable()->after('document_number_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'document_type',
                'document_number_hash',
                'document_number_encrypted',
            ]);
        });
    }
};
