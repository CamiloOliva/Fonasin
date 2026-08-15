# Auditoria y trazabilidad

## Objetivo

Registrar quien hizo una accion, sobre que registro, cuando ocurrio y cual fue el resultado. La auditoria apoya investigacion operativa y no reemplaza una politica legal de retencion.

## Tablas

### `audit_events`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID | identificador del evento |
| `occurred_at` | timestamptz | fecha y hora UTC |
| `actor_user_id` | UUID nullable | usuario que realizo la accion; null si fue sistema |
| `actor_type` | varchar(20) | `user` o `system` |
| `module` | varchar(40) | `affiliation`, `credits`, `portal`, `content`, `fpqrs` |
| `action` | varchar(80) | accion semantica registrada |
| `subject_type` | varchar(80) | tipo del recurso afectado |
| `subject_id` | UUID | recurso afectado |
| `correlation_id` | UUID nullable | agrupa eventos de una misma operacion |
| `ip_hash` | char(64) nullable | referencia tecnica minimizada |
| `metadata` | jsonb | solo metadatos permitidos y valores redactados |

### `auth_events`

Registra `login_succeeded`, `login_failed`, `logout`, `password_reset_requested`, `password_reset_completed`, `account_blocked` y cambios de segundo factor.

## Eventos obligatorios

- envio, aprobacion, rechazo y cancelacion de una afiliacion;
- carga, aceptacion, rechazo y descarga de documentos;
- creacion, modificacion y archivado de creditos;
- acceso del asociado a datos de sus creditos;
- cambios de roles, usuarios y permisos;
- publicacion o retiro de imagenes del carrusel;
- eventos de autenticacion.

## Reglas de seguridad

- Los eventos son solo de insercion desde la aplicacion; no se editan ni eliminan desde Filament.
- No se incluyen contrasenas, tokens, valores financieros completos, numeros de documento, contenido SARLAFT, archivos ni mensajes completos de FPQRS.
- Los cambios se almacenan como resumen redactado, por ejemplo `status: submitted -> under_review`.
- Las transacciones de negocio y su evento de auditoria se guardan juntas; si una falla, ninguna queda persistida.
- Para acciones administrativas criticas se exige `actor_user_id` y `correlation_id`.

## Evolucion

La primera version usa auditoria desde la aplicacion. Si se habilitan integraciones, acceso SQL de terceros o requerimientos de inmutabilidad reforzada, se evaluan triggers PostgreSQL, exportacion a almacenamiento inmutable y alertas.
