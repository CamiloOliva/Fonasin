<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('release:verify', function (): int {
    $migrator = app(Migrator::class);
    $repository = $migrator->getRepository();
    if (! $repository->repositoryExists()) {
        $this->error('No existe la tabla de migraciones; el backend no está listo para publicar el frontend.');

        return 1;
    }

    $available = array_keys($migrator->getMigrationFiles(database_path('migrations')));
    $pending = array_values(array_diff($available, $repository->getRan()));
    if ($pending !== []) {
        $this->error('Hay '.count($pending).' migración(es) pendiente(s); el backend no está listo para publicar el frontend.');

        return 1;
    }

    $this->info('Backend y migraciones listos para publicar el frontend.');

    return 0;
})->purpose('Bloquea la publicación del frontend si el esquema del backend está pendiente');
