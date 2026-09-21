# Backend Laravel de FONASIN

Aplicacion Laravel 12 que concentra persistencia MariaDB, autenticacion, autorizacion, casos de uso, documentos privados y auditoria de FONASIN.

El backend esta en construccion. Actualmente contiene las migraciones base, modelos Eloquent y relaciones para Identity, Affiliation, Credits y persistencia de eventos, reglas de dominio para afiliacion, casos de uso para crear borradores, cifrar y guardar secciones, registrar consentimientos, registrar documentos privados, generar PDFs de envio, enviar solicitudes completas con auditoria tras validar secciones, documentos y consentimientos, y rutas web JSON iniciales para el flujo de afiliacion; todavia quedan pendientes ajustes de produccion como descarga autorizada de documentos generados y decisiones finales de negocio.

## Requisitos

- PHP 8.2 o superior con `pdo_mysql`.
- Composer.
- MariaDB 10.11 o superior con datos sinteticos o vacios.

## Configuracion inicial

Desde `backend/`:

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

En Linux o macOS usar `cp .env.example .env`. Antes de migrar, revisar que `.env` use una base MariaDB exclusivamente local.

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

- Usar UUID y persistir fechas en UTC para datos operativos.
- No eliminar fisicamente solicitudes, usuarios, creditos o documentos.
- Cifrar datos sensibles antes de persistirlos y no incluirlos en logs o auditoria.
- Guardar documentos fuera de `public/` y entregarlos solo mediante rutas autorizadas.
- Registrar acciones sensibles en `audit_events` y eventos de autenticacion en `auth_events`.
- Mantener reglas de negocio fuera de controladores, modelos de presentacion y componentes React.

Las decisiones completas estan en [`../AGENTS.md`](../AGENTS.md) y [`../docs/`](../docs/README.md).

## Apache y cPanel

Cuando se apruebe el despliegue del backend, Apache debe apuntar exclusivamente a `backend/public/`. El resto de `backend/`, su `.env`, `storage/` y las dependencias no deben quedar expuestos como document root.
