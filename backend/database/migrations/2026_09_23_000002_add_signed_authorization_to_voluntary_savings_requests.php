<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voluntary_savings_requests', function (Blueprint $table): void {
            $table->string('signed_authorization_storage_key', 500)->nullable()->after('authorization_storage_key');
            $table->timestamp('signed_authorization_uploaded_at')->nullable()->after('signed_authorization_storage_key');
            $table->foreignUuid('signed_authorization_uploaded_by_user_id')
                ->nullable()
                ->after('signed_authorization_uploaded_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('voluntary_savings_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('signed_authorization_uploaded_by_user_id');
            $table->dropColumn([
                'signed_authorization_storage_key',
                'signed_authorization_uploaded_at',
            ]);
        });
    }
};
