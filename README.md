# FONASIN - Plataforma institucional

FONASIN combina el frontend publico en React/Vite con un backend Laravel 12 organizado como monolito modular. MariaDB conserva los datos operativos de afiliacion, creditos, aportes y ahorros; el portal privado y la administracion consumen esos casos de uso.

## Estado actual

- El frontend publico vive en `src/` y se compila como archivos estaticos en `dist/`.
- Laravel vive en `backend/`; no agregar codigo de backend en los esqueletos homonimos de la raiz.
- MariaDB es la fuente de verdad para datos operativos.
- Existen migraciones y casos de uso para identidad, afiliacion, creditos, aportes/ahorros, importaciones y auditoria.
- Hay autenticacion, roles, portal del asociado y panel administrativo. Las cargas XLSX de creditos, aportes, ahorro permanente y ahorro voluntario tienen pruebas de permisos, persistencia y aislamiento por asociado.
- El otrosi aprobado incluye consulta privada de los tres saldos y solicitud de ahorro voluntario con libranza, decision administrativa y nuevo intento tras rechazo. El recorrido automatizado usa datos ficticios; no sustituye la validacion operativa ni la aceptacion de FONASIN con archivos reales anonimizados.
- `develop` es integracion y simulacion local. Solo `main`, previa revision de Diego, es candidata a produccion en cPanel.

## Requisitos locales

- Node.js 20 o superior y npm.
- PHP 8.2 o superior y Composer.
- MariaDB 10.11 o superior con una base y un usuario exclusivos para desarrollo.

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

Antes de ejecutar migraciones, confirmar que `backend/.env` apunta a MariaDB local. En Linux o macOS usar `cp .env.example .env`.

## Seguridad

- No versionar `.env`, credenciales, documentos privados ni datos personales.
- No guardar archivos en MariaDB ni dentro de directorios publicos.
- No ejecutar migraciones o seeds contra produccion sin respaldo y aprobacion explicita.
- El contenido marcado como provisional debe sustituirse por informacion oficial antes de produccion.

## Documentacion

- [Guia obligatoria](AGENTS.md)
- [Documentacion tecnica](docs/README.md)
- [Arquitectura](docs/architecture/overview.md)
- [Modelo de datos](docs/architecture/data-model.md)
- [Desarrollo local](docs/operations/local-development.md)
- [Preparacion de cPanel](infra/cpanel/README.md)
