# Entornos y despliegue

## Entornos

| Entorno | Rama | Destino | Base de datos |
|---|---|---|---|
| Desarrollo | `develop` | equipo local | datos locales o sinteticos |
| Produccion | `main` | `tudominio.com` | PostgreSQL produccion |

`develop` no se despliega en cPanel. La validacion ocurre localmente y Diego realiza el merge aprobado de `develop` a `main`. Solo `main` llega al dominio principal.

Produccion usa su propio `.env`, base de datos, claves de cifrado y almacenamiento de documentos. Nunca se comparten credenciales ni archivos con desarrollo local.

## Frontend React actual

El hosting cPanel actual usa Apache y no tiene Node.js disponible para la cuenta. Por tanto, el frontend se compila fuera del servidor mediante `npm ci` y `npm run build`; Apache recibe unicamente los archivos de `dist/`.

La estrategia de Docker local y los requisitos operativos del backend Laravel se documentan en `container-strategy.md`.

La validacion automatizada comprueba que `public/.htaccess` se copie a `dist/.htaccess`. Apache debe servir el contenido compilado de `dist/` en el document root del dominio principal; no debe recibir `src/`, `node_modules/` ni ejecutar Node.js.

## Backend Laravel en Apache/cPanel

Cuando el Backend entre en produccion, Apache debe apuntar exclusivamente a `backend/public/`. El codigo de `backend/` debe permanecer fuera del document root. El servidor debe tener PHP compatible, extensiones requeridas, Composer, PostgreSQL y permisos controlados para `backend/storage/` y `backend/bootstrap/cache/`.

XAMPP, PHP local, `vendor/` local y los archivos `.env` de desarrollo nunca se suben a `main` ni al servidor. En produccion se instala Composer en el servidor o mediante un artefacto de despliegue aprobado y se configura un `.env` propio.

## Flujo de produccion actual

```text
feature/* -> develop (local) -> revision y merge de Diego -> main -> dominio principal
```

El repositorio cPanel debe permanecer asociado a `main`. No configurar `develop` como rama activa ni crear un despliegue alterno mientras esta sea una decision del proyecto.

## Publicacion del frontend

Como cPanel no dispone de Node.js para la cuenta, el bundle Vite se compila fuera del servidor. La opcion objetivo es una automatizacion de GitHub Actions que, al actualizar `main`, ejecute `npm ci`, `npm run build` y copie solo `dist/` al document root del dominio principal mediante una conexion segura.

No confirmar `dist/` en Git como solucion permanente y no copiar `node_modules` al hosting.

React Router requiere el fallback de Apache incluido en `public/.htaccess`; este archivo se copia al build y evita errores 404 al abrir una ruta directamente. Consultar `frontend-development.md` antes de modificar rutas o automatizar la publicacion.

## Verificacion posterior

- pagina principal responde por HTTPS;
- las rutas React cargan al refrescar la pagina;
- no hay listado de directorios Apache;
- enlaces, imagenes y WhatsApp usan configuracion de produccion;
- no se publicaron `.env`, archivos privados ni mapas de fuente no deseados.

## Controles previos a produccion

1. Probar `develop` localmente y ejecutar las pruebas automatizadas.
2. Diego revisa y hace el merge de la pull request a `main`.
3. Realizar respaldo verificable de PostgreSQL antes de cualquier migracion.
4. Revisar migraciones: deben ser compatibles hacia atras.
5. Desplegar `main` y ejecutar migraciones de forma controlada.
6. Verificar autenticacion, cargas documentales y funciones publicas.

No se configura despliegue automatico ni `.cpanel.yml` hasta confirmar usuario de cPanel, rutas reales, version de PHP, Composer, Node y disponibilidad de PostgreSQL.
