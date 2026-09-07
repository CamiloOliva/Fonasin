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

Para activar cabeceras de seguridad en Laravel:

```text
DATA_HASH_PEPPER=generar_valor_largo_y_secreto_por_entorno
SECURITY_CSP_ENABLED=true
SECURITY_CSP_POLICY="default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data: https:; font-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'"
```

El frontend React compilado en `dist/` se sirve como archivos estaticos por Apache. Si el dominio principal sirve directamente `dist/`, configurar una CSP equivalente desde Apache/cPanel; el middleware de Laravel solo cubre respuestas que pasan por `backend/public/index.php`.

`DATA_HASH_PEPPER` protege hashes de busqueda de documento, correo, IP y agente de usuario. Debe existir antes de migrar datos reales y debe mantenerse estable por entorno; si cambia, las busquedas de identidad y recuperacion de contrasena no coincidiran hasta recalcular los hashes.

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
7. Verificar cabeceras HTTP en produccion: CSP, `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy`.

### Diagnostico previo de consentimientos

Antes de ejecutar `2026_08_17_140950_add_unique_constraint_to_consent_records.php` en una base que ya contenga consentimientos, ejecutar:

```sql
SELECT application_id, consent_type, policy_version, COUNT(*) AS records
FROM consent_records
GROUP BY application_id, consent_type, policy_version
HAVING COUNT(*) > 1;
```

La migracion puede continuar solamente si la consulta no devuelve filas. Si existen duplicados, detener el despliegue y revisar cada caso con el responsable funcional. Los consentimientos son evidencia y no deben eliminarse o consolidarse automaticamente.

### Diagnostico previo de borradores de actualizacion

Antes de ejecutar `2026_09_04_000002_add_unique_active_draft_per_associate_index.php` en una base que ya contenga solicitudes, generar respaldo y reporte con:

```sql
SELECT associate_id, COUNT(*) AS active_drafts
FROM affiliation_applications
WHERE status = 'draft' AND associate_id IS NOT NULL
GROUP BY associate_id
HAVING COUNT(*) > 1;
```

La migracion cancela borradores duplicados antiguos y conserva el mas reciente para permitir el indice unico parcial. Si la consulta devuelve filas en produccion, se debe guardar el reporte, confirmar respaldo restaurable y obtener aprobacion funcional antes de ejecutar la migracion.

### Diagnostico previo de documentos de usuario

Antes de ejecutar `2026_09_06_000001_add_unique_document_hash_index_to_users_table.php`, validar que no existan usuarios con el mismo documento hasheado:

```sql
SELECT document_number_hash, COUNT(*) AS users
FROM users
WHERE document_number_hash IS NOT NULL
GROUP BY document_number_hash
HAVING COUNT(*) > 1;
```

Si existen duplicados, detener el despliegue y resolver cada identidad con el responsable funcional. No reasignar usuarios ni asociados de forma silenciosa.

### Diagnostico previo de remigracion HMAC

Antes de ejecutar `2026_09_06_000002_rehash_sensitive_lookup_values_with_hmac.php`, confirmar:

- respaldo restaurable de PostgreSQL;
- `DATA_HASH_PEPPER` definido en el `.env` productivo;
- ausencia de duplicados de documento en `users` y `associates`;
- validacion funcional posterior de login, recuperacion de contrasena, alta manual de asociados, habilitacion de afiliacion y FPQRS.

La migracion recalcula hashes de busqueda desde valores cifrados o campos operativos ya existentes. No exponer ni copiar el pepper a GitHub, Markdown, capturas o tickets.

No se configura despliegue automatico ni `.cpanel.yml` hasta confirmar usuario de cPanel, rutas reales, version de PHP, Composer, Node y disponibilidad de PostgreSQL.
