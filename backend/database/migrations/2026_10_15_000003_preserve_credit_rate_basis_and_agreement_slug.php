<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->string('interest_rate_basis', 20)->nullable();
        });
        Schema::table('public_content_items', function (Blueprint $table): void {
            $table->string('legacy_detail_slug', 80)->nullable()->unique();
        });
        foreach ([
            'caribbean-sol-mar-logo.jpg' => 'caribbean-sol-y-mar', 'luz-marina-vargas-logo.jpg' => 'luz-marina-vargas',
            'emi.png' => 'emi', 'sanitas.png' => 'sanitas', 'emermedica.png' => 'emermedica',
            'uma-ips.png' => 'uma-ips', 'coorserpark.png' => 'coorserpark', 'los-olivos.png' => 'los-olivos',
            'manejar.png' => 'manejar', 'practicar.png' => 'practicar',
        ] as $image => $slug) {
            $id = DB::table('public_content_items')->where('kind', 'agreement')
                ->where('static_image_path', '/images/convenios/'.$image)->orderBy('id')->value('id');
            if ($id) {
                DB::table('public_content_items')->where('id', $id)->update(['legacy_detail_slug' => $slug]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('public_content_items', function (Blueprint $table): void {
            $table->dropUnique(['legacy_detail_slug']);
            $table->dropColumn('legacy_detail_slug');
        });
        Schema::table('credit_accounts', function (Blueprint $table): void {
            $table->dropColumn('interest_rate_basis');
        });
    }
};
