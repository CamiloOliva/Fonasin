# ADR-002: PostgreSQL y auditoria por aplicacion

**Estado:** aceptada

## Contexto

El proyecto requiere relaciones entre asociados, solicitudes, documentos y creditos, ademas de trazabilidad de acciones administrativas.

## Decision

Usar PostgreSQL con UUID, migraciones versionadas y tablas `audit_events` y `auth_events`. La auditoria se registra desde los casos de uso y se persiste en la misma transaccion de negocio.

## Consecuencias

- Las acciones importantes son trazables sin guardar contenido sensible en la bitacora.
- Las migraciones se prueban en staging antes de produccion.
- La auditoria avanzada por triggers se pospone hasta que exista una necesidad comprobada.
