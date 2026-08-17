# FONASIN - Plataforma institucional

FONASIN combina el frontend publico actual en React/Vite con un backend Laravel 12 en construccion. El objetivo es un monolito modular con PostgreSQL, afiliacion digital, portal privado, administracion limitada y trazabilidad.

## Estado actual

- El frontend publico vive en `src/` y se compila como archivos estaticos en `dist/`.
- Laravel vive en `backend/`; no agregar codigo de backend en los esqueletos homonimos de la raiz.
- PostgreSQL es la fuente de verdad para datos operativos.
- Las migraciones base de Identity, Affiliation, Credits y Audit ya estan creadas.
- Identity ya cuenta con los modelos `User`, `Role` y `Associate`, sus relaciones y los roles iniciales versionados mediante seeder.
- La autenticacion, los casos de uso, el portal privado y la administracion siguen pendientes.

## Requisitos locales

- Node.js 20 o superior y npm.
- PHP 8.2 o superior y Composer.
- PostgreSQL con una base y un usuario exclusivos para desarrollo.

## Frontend

Desde la raiz del repositorio:

```bash
npm ci
npm run dev
npm run test
npm run build
```

## Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan test
php artisan serve
```

Antes de ejecutar migraciones, confirmar que `backend/.env` apunta a PostgreSQL local. En Linux o macOS usar `cp .env.example .env`.

## Seguridad

- No versionar `.env`, credenciales, documentos privados ni datos personales.
- No guardar archivos en PostgreSQL ni dentro de directorios publicos.
- No ejecutar migraciones o seeds contra produccion sin respaldo y aprobacion explicita.
- El contenido marcado como provisional debe sustituirse por informacion oficial antes de produccion.

## Documentacion

- [Guia obligatoria](AGENTS.md)
- [Documentacion tecnica](docs/README.md)
- [Arquitectura](docs/architecture/overview.md)
- [Modelo de datos](docs/architecture/data-model.md)
- [Desarrollo local](docs/operations/local-development.md)
- [Preparacion de cPanel](infra/cpanel/README.md)
