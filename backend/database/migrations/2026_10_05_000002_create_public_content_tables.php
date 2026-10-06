<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_content_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('kind', 32);
            $table->string('title', 255);
            $table->text('summary')->nullable();
            $table->string('category', 80)->nullable();
            $table->string('link_url', 500)->nullable();
            $table->string('static_image_path', 500)->nullable();
            $table->string('image_storage_key', 500)->nullable();
            $table->string('image_mime_type', 80)->nullable();
            $table->string('document_storage_key', 500)->nullable();
            $table->boolean('published')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestampTz('published_at')->nullable();
            $table->foreignUuid('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['kind', 'published', 'sort_order']);
        });

        Schema::create('public_site_settings', function (Blueprint $table): void {
            $table->string('key', 60)->primary();
            $table->string('value', 500)->nullable();
            $table->foreignUuid('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        $now = now();
        DB::table('public_site_settings')->insert([
            ['key' => 'contact_email', 'value' => 'fonasin.bucaramanga@fonasin.com', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'facebook_url', 'value' => null, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'instagram_url', 'value' => null, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'youtube_url', 'value' => null, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Move currently published static cards into editable rows without touching their assets.
        $agreements = [
            ['Caribbean Sol y Mar', 'Turismo', 'Tiquetes, hoteles, tours y asesoría personalizada para viajes nacionales e internacionales.', '/images/convenios/caribbean-sol-mar-logo.jpg'],
            ['Luz Marina Vargas', 'Turismo', 'Agencia de viajes con atención personalizada para asociados FONASIN.', '/images/convenios/luz-marina-vargas-logo.jpg'],
            ['EMI', 'Salud y bienestar', 'Atención médica 24/7 en casa con tarifa especial para asociados FONASIN.', '/images/convenios/emi.png'],
            ['Sanitas', 'Salud y bienestar', 'Plan Premium de salud con beneficios exclusivos para asociados FONASIN.', '/images/convenios/sanitas.png'],
            ['Emermédica', 'Salud y bienestar', 'Convenio de salud y bienestar. Información detallada por confirmar.', '/images/convenios/emermedica.png'],
            ['UMA IPS', 'Salud y bienestar', 'Convenio de salud y bienestar. Información detallada por confirmar.', '/images/convenios/uma-ips.png'],
            ['Gimnasios', 'Salud y bienestar', 'Beneficios en gimnasios. Proveedores y condiciones por confirmar.', '/images/logo-placeholder.svg'],
            ['Coorserpark', 'Funerarios', 'Convenio de previsión exequial con cobertura nacional para asociados FONASIN.', '/images/convenios/coorserpark.png'],
            ['Funeraria Los Olivos', 'Funerarios', 'Convenio funerario. Información detallada por confirmar.', '/images/convenios/los-olivos.png'],
            ['Manejar', 'Servicios vehiculares', 'Servicio vehicular. Información detallada por confirmar.', '/images/convenios/manejar.png'],
            ['Practicar', 'Servicios vehiculares', 'Servicio vehicular. Información detallada por confirmar.', '/images/convenios/practicar.png'],
        ];
        foreach ($agreements as $position => [$title, $category, $summary, $image]) {
            DB::table('public_content_items')->insert([
                'id' => (string) Str::uuid(), 'kind' => 'agreement', 'title' => $title,
                'category' => $category, 'summary' => $summary, 'static_image_path' => $image,
                'published' => true, 'published_at' => $now, 'sort_order' => $position,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        foreach ([
            ['Información FONASIN', 'Espacio reservado para campañas y comunicaciones institucionales.', '/flyer1.png'],
            ['Bienestar para nuestros asociados', 'Contenido visual administrable para futuras campañas.', '/flyer2.png'],
            ['Beneficios y convenios', 'Aquí podrán destacarse novedades y beneficios vigentes.', '/flyer3.png'],
        ] as $position => [$title, $summary, $image]) {
            DB::table('public_content_items')->insert([
                'id' => (string) Str::uuid(), 'kind' => 'banner', 'title' => $title,
                'summary' => $summary, 'static_image_path' => $image,
                'published' => true, 'published_at' => $now, 'sort_order' => $position,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('public_site_settings');
        Schema::dropIfExists('public_content_items');
    }
};
