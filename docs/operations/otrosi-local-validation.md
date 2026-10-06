# Validacion local de los tres modulos del otrosi

No ejecutar estos pasos en cPanel ni sobre datos reales. La aprobacion contractual
no equivale a que FONASIN haya aceptado la entrega. Ver ADR-004.

## Criterio de entrega

1. Admin importa las tres plantillas XLSX por separado, consulta errores e historial.
2. El asociado ve solo sus saldos: aportes, permanente y voluntario. Otra sesion
   no puede seleccionar su perfil por query ni descargar sus documentos.
3. Solicitud mensual voluntaria genera PDF privado con valor correcto solo si
   el perfil habilitado contiene datos personales y laborales minimos. Sin
   perfil, el servidor devuelve error sin solicitud ni PDF. Una pendiente
   bloquea otra en UI y servidor. La confirmacion es obligatoria.
4. Reviewer consulta; admin marca revision favorable o rechazo. Revision favorable
   queda pendiente de autorizacion empresarial; solo cargar y confirmar el PDF
   firmado por la empresa aprueba definitivamente. Rechazo conserva historial
   y permite una solicitud nueva; dos aprobadas pueden coexistir. Aprobacion no
   aumenta saldo sin importacion.
5. Token CSRF vencido se renueva una vez. Error de permisos no se reintenta.
6. MariaDB real, tests de regresion y navegador integrado pasan. Un HTTP 200 no
   demuestra por si solo contenido, PDF, roles ni persistencia.

Regla aceptada el 5 de octubre de 2026: una nueva solicitud despues de aprobacion
definitiva es posible y no sustituye las anteriores. Ver ADR-005. Antes de
produccion, revisar solicitudes `approved` antiguas sin PDF firmado; no se
clasifican automaticamente.

## Dependencias

PHP 8.2+ con pdo_mysql, pdo_sqlite, dom, mbstring y zip; Composer; Node compatible
con package-lock (22.22.2+ o 24.15+); MariaDB 10.11+ local; Chromium/Edge para E2E.
No instalar Node en cPanel: el artefacto frontend se compila antes de publicar.

```bash
npm ci
cd backend
composer install --prefer-dist --no-interaction
```

Crear .env local a partir de .env.example, generar APP_KEY y pepper locales.
Los valores de produccion no se copian al entorno de desarrollo. Los tests
usan SQLite por defecto; para la suite MariaDB exportar DB_CONNECTION=mariadb,
DB_HOST=127.0.0.1, DB_PORT, DB_DATABASE=fonasin_test y credenciales locales.
Declarar en CORS_ALLOWED_ORIGINS los origenes locales usados; la prueba exige
una lista explicita sin comodines, no un puerto fijo. Para este E2E con proxy
same-origin puede mantenerse el origen por defecto.

```bash
php artisan test --compact
```

No compartir la base fonasin_test con otra suite simultanea: RefreshDatabase
puede reconstruir su esquema. La prueba E2E utiliza una base DIFERENTE.

## Navegador integrado, sin mocks

Crear una base local vacia `fonasin_e2e` y darle permisos al usuario local.
Exportar DB_DATABASE=fonasin_e2e y APP_ENV=local antes de estos pasos:

```bash
php artisan migrate --force
php tests/Browser/seed-otrosi.php
php artisan serve --host=127.0.0.1 --port=8017
```

El fixture exige host local, MariaDB y nombre exacto fonasin_e2e; crea usuarios
sinteticos con contrasena aleatoria, perfil afiliado habilitado y tres XLSX.
Credenciales y capturas solo en `.e2e-artifacts/`, ignorado por Git. No es un
seeder de produccion y nunca habilita usuarios reales.

En otra terminal, desde raiz, exportar VITE_BACKEND_DEV_PROXY_TARGET con valor
http://127.0.0.1:8017; sin VITE_BACKEND_BASE_URL de produccion:

```bash
npm run dev -- --host=127.0.0.1 --port=5187 --strictPort
```

En una tercera terminal:

```bash
npx playwright install chromium
npm run test:e2e
```

Alternativa Windows: E2E_BROWSER puede apuntar al ejecutable Edge instalado.
E2E_URL solo admite localhost/127.0.0.1. La prueba inicia sesion por formulario
real con cuatro roles, carga XLSX mediante UI, verifica importes persistidos,
solicita, rechaza, reintenta, aprueba y registra PDF; comprueba propietario ajeno
y reviewer. Las capturas desktop/movil son evidencia visual, no aceptacion del
cliente. Reejecutar el fixture antes de cada corrida para evitar reusar lotes.

Si PHP CLI no tiene zip habilitado, usar `php -d extension=zip` para pruebas.
Para el servidor integrado ese flag no se propaga desde artisan serve a su
subproceso: habilitar zip en el php.ini LOCAL o ejecutar PHP -S desde public
con el router Laravel y el flag. Nunca editar el php.ini de produccion por esto.

## Artefacto para cPanel

Tras pasar todas las verificaciones, compilar con
VITE_BACKEND_BASE_URL=https://api.fonasin.com y `npm run build`. Comprobar
dist/index.html y dist/.htaccess; empaquetar solo dist. El backend se actualiza
por Git/Composer en su directorio privado, preservando .env, storage y ajustes
del hosting. No copiar el repositorio completo a public_html.

No integrar a develop ni afirmar listo para publicar si una prueba falla,
un hallazgo bloqueante permanece abierto o falta evidencia registrada.
