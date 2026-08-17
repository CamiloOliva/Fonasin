# Documentacion tecnica de FONASIN

Este directorio es la fuente de verdad tecnica del proyecto. Antes de cambiar arquitectura, datos, seguridad, despliegue o alcance, revisar los documentos relacionados y actualizar los que resulten afectados.

La guia obligatoria para agentes y desarrolladores esta en [`AGENTS.md`](../AGENTS.md).

## Estado actual

La aplicacion activa es un frontend React, TypeScript, Vite y Tailwind. Laravel, PostgreSQL y el portal privado son objetivos de la siguiente fase: existe el esqueleto de carpetas y la documentacion, pero no hay backend, migraciones ni base de datos creados todavia.

## Lectura por rol

| Rol | Leer primero |
|---|---|
| Desarrollo frontend | `AGENTS.md`, `architecture/overview.md`, `operations/local-development.md` |
| Desarrollo backend | `AGENTS.md`, `architecture/overview.md`, `architecture/data-model.md`, `architecture/audit.md` |
| Infraestructura | `operations/deployment.md`, `operations/container-strategy.md`, `../infra/cpanel/README.md` |
| Revisor funcional | `architecture/module-boundaries.md`, `architecture/data-model.md`, `security.md` |

## Indice

- [Arquitectura](architecture/overview.md): componentes, capas, dependencias y transicion tecnica.
- [Limites de modulos](architecture/module-boundaries.md): responsabilidades, propietarios y comunicacion permitida.
- [Modelo de datos](architecture/data-model.md): tablas base, relaciones, estados, indices y reglas PostgreSQL.
- [Auditoria](architecture/audit.md): bitacora operativa, eventos de seguridad y reglas de inmutabilidad.
- [Seguridad y privacidad](security.md): autorizacion, documentos, secretos y datos sensibles.
- [API futura](api/README.md): reglas de versionado e integracion externa.
- [Decisiones de arquitectura](adr/): decisiones aceptadas y su justificacion.
- [Desarrollo local](operations/local-development.md): ramas, comandos y controles previos a una PR.
- [Frontend React](operations/frontend-development.md): desarrollo Vite, rutas SPA y publicacion segura en Apache.
- [Despliegue](operations/deployment.md): validacion local, merge de Diego y produccion en `main`.
- [Estrategia de contenedores](operations/container-strategy.md): Docker local y limites del cPanel actual.
- [Trazabilidad Frontend](requirements/frontend-traceability.md): estado, evidencia y criterio de cierre de cada requisito funcional.
