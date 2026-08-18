# Backend Laravel de FONASIN

Aplicacion Laravel 12 que concentra persistencia PostgreSQL, autenticacion futura, autorizacion, casos de uso, documentos privados y auditoria de FONASIN.

El backend esta en construccion. Actualmente contiene las migraciones base, modelos Eloquent y relaciones para Identity, Affiliation, Credits y persistencia de eventos, las primeras reglas de dominio para afiliacion, el caso de uso inicial para crear borradores, el seeder de roles y pruebas de persistencia; todavia no expone autenticacion, portal privado ni funciones administrativas.

## Requisitos

- PHP 8.2 o superior con extensiones de PostgreSQL.
- Composer.
- PostgreSQL local con datos sinteticos o vacios.

## Configuracion inicial

Desde `backend/`:

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

En Linux o macOS usar `cp .env.example .env`. Antes de migrar, revisar que `.env` use una base PostgreSQL exclusivamente local.

## Desarrollo y verificacion

```bash
php artisan serve
php artisan test
php vendor/bin/pint --test
php artisan migrate:status
```

El frontend React activo se desarrolla y compila desde la raiz del repositorio, no desde este directorio.

## Estructura oficial

```text
backend/
  app/              # HTTP, modelos y capas de aplicacion, dominio e infraestructura
  database/         # Migraciones, factories y seeders
  resources/        # Presentacion Laravel/Inertia durante la migracion incremental
  routes/           # Rutas web y comandos
  storage/          # Archivos privados, cache y logs no versionados
  tests/            # Pruebas unitarias, feature y futuras pruebas de navegador
```

No agregar codigo Laravel en `app/`, `database/`, `resources/` o `tests/` de la raiz.

## Reglas esenciales

- Usar UUID y fechas con zona horaria para datos operativos.
- No eliminar fisicamente solicitudes, usuarios, creditos o documentos.
- Cifrar datos sensibles antes de persistirlos y no incluirlos en logs o auditoria.
- Guardar documentos fuera de `public/` y entregarlos solo mediante rutas autorizadas.
- Registrar acciones sensibles en `audit_events` y eventos de autenticacion en `auth_events`.
- Mantener reglas de negocio fuera de controladores, modelos de presentacion y componentes React.

Las decisiones completas estan en [`../AGENTS.md`](../AGENTS.md) y [`../docs/`](../docs/README.md).

## Apache y cPanel

Cuando se apruebe el despliegue del backend, Apache debe apuntar exclusivamente a `backend/public/`. El resto de `backend/`, su `.env`, `storage/` y las dependencias no deben quedar expuestos como document root.
