<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('associates', function (Blueprint $table): void {
            // Existing production associates keep their status; only new manual/imported records use this gate.
            $table->boolean('legacy_validation_required')->default(false);
            $table->string('identity_support_storage_key')->nullable();
            $table->string('identity_support_mime_type', 80)->nullable();
            $table->timestampTz('legacy_validated_at')->nullable();
            $table->foreignUuid('legacy_validated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('associates', function (Blueprint $table): void {
            $table->dropForeign(['legacy_validated_by_user_id']);
            $table->dropColumn([
                'legacy_validation_required',
                'identity_support_storage_key',
                'identity_support_mime_type',
                'legacy_validated_at',
                'legacy_validated_by_user_id',
            ]);
        });
    }
};
