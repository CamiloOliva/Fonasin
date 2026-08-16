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

## Patron de implementacion

1. El caso de uso inicia una transaccion.
2. Realiza el cambio de negocio autorizado.
3. Inserta el evento de auditoria con una accion semantica.
4. Confirma la transaccion.

Si el cambio o la auditoria fallan, se revierte todo. No registrar diffs completos de registros sensibles: usar campos permitidos y valores redactados.

## Consulta operativa

Las vistas administrativas deben filtrar eventos por modulo, recurso, actor, accion y rango de fechas. El detalle se trata como evidencia operativa y es de solo lectura.

## Retencion

El periodo de retencion se definira con FONASIN y su asesoria juridica. Hasta contar con esa decision, los agentes no deben implementar eliminacion automatica de auditoria, documentos ni solicitudes.

## Evolucion

La primera version usa auditoria desde la aplicacion. Si se habilitan integraciones, acceso SQL de terceros o requerimientos de inmutabilidad reforzada, se evaluan triggers PostgreSQL, exportacion a almacenamiento inmutable y alertas.
