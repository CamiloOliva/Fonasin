# Preparacion de cPanel y Apache

El proyecto tendra un unico despliegue en cPanel:

| Rama | Dominio | Uso |
|---|---|---|
| `main` | dominio principal | produccion |

La rama `develop` se trabaja y valida localmente. Diego realiza el merge aprobado hacia `main`; no se crea ni configura subdominio de desarrollo.

No se ha creado aun un `.cpanel.yml` operativo porque requiere valores que no deben adivinarse: rutas absolutas de ambos document roots, version de PHP, Composer y disponibilidad de PostgreSQL.

La cuenta actual no tiene Node.js ni permisos de administrador. Por lo tanto, cPanel no debe construir el frontend React. El build se realiza localmente o en CI y Apache recibe la carpeta `dist/` lista para servir.

## Configuracion esperada

1. Mantener el repositorio administrado por cPanel con `main` como rama activa.
2. Configurar el despliegue del dominio principal solo desde `main`.
3. Crear el `.env` de produccion cuando exista Laravel.
4. Configurar la base PostgreSQL y almacenamiento privado de produccion.

## Publicacion actual del frontend

Apache sirve archivos estaticos desde el document root de dominio principal. La cuenta no dispone de Node.js, por lo que el servidor no ejecuta `npm install` ni `npm run build`.

La automatizacion futura debe copiar unicamente el contenido de `dist/` compilado fuera del hosting. El document root no debe contener el repositorio completo, `node_modules`, archivos `.env`, documentos privados ni fuentes de desarrollo innecesarias.

## Laravel futuro

Cuando se apruebe el backend, el codigo Laravel debe ubicarse fuera del document root. Apache debe apuntar solamente al directorio `public` de Laravel. Antes de hacerlo, confirmar PHP compatible, Composer, extensiones, PostgreSQL, cron y permisos de storage.

## Antes de activar el despliegue

Registrar en el ticket de infraestructura, sin incluir secretos en Git:

- dominio principal y su document root;
- usuario y ruta de cada document root;
- acceso SSH;
- salida de `php --version` y `composer --version`;
- confirmacion de PostgreSQL en cPanel.
