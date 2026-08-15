# API futura

La primera version web usara rutas Inertia y sesiones Laravel. No se debe crear una API publica solo por anticipacion.

Cuando exista una app movil o una integracion aprobada, se habilitara `/api/v1` reutilizando los mismos casos de uso del dominio.

## Reglas futuras

- versionar rutas desde el primer endpoint externo;
- autenticar con Laravel Sanctum o el mecanismo aprobado para el consumidor;
- documentar cada endpoint con OpenAPI;
- aplicar permisos por rol y por recurso;
- no exponer documentos mediante URL permanente;
- no duplicar reglas de negocio en controladores API.
