# Documentacion tecnica de FONASIN

Este directorio es la fuente de verdad para las decisiones tecnicas del proyecto.

## Indice

- [Arquitectura](architecture/overview.md): componentes, capas y limites de los modulos.
- [Modelo de datos](architecture/data-model.md): tablas base, relaciones y reglas de PostgreSQL.
- [Auditoria](architecture/audit.md): eventos que se registran y datos que nunca se registran.
- [API](api/README.md): contrato futuro para integraciones externas.
- [Decisiones de arquitectura](adr/): decisiones que no deben cambiarse sin una nueva ADR.
- [Desarrollo local](operations/local-development.md): ramas, entornos y controles previos a una PR.
- [Despliegue](operations/deployment.md): separacion entre staging y produccion.

## Estado

La aplicacion actual es un frontend React/Vite. La estructura Laravel y las migraciones de PostgreSQL se han preparado como esqueleto documental; no hay backend ni base de datos creados todavia.
