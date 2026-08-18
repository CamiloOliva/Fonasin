# API futura

## Estado

La primera version web usa rutas Laravel/Inertia y sesiones. No existe una API publica ni debe crearse solo por anticipacion.

## Cuando crearla

Solo al aprobar una aplicacion movil, integracion con terceros o consumidor externo identificado. La decision debe definir propietario, autenticacion, datos expuestos, limites de uso, soporte y auditoria.

## Convenciones obligatorias

- Prefijo `/api/v1` desde el primer endpoint externo.
- Especificacion OpenAPI versionada en esta carpeta antes de implementar un endpoint.
- Autenticacion con Sanctum u otro mecanismo aprobado para el consumidor.
- Autorizacion por recurso en servidor; no confiar en identificadores enviados por el cliente.
- Errores consistentes, sin datos internos ni secretos.
- Paginacion para colecciones y limites de tasa para rutas expuestas.
- Los controladores API reutilizan casos de uso existentes; no duplican reglas de negocio.

## Ejemplo de contrato futuro

```text
GET /api/v1/me/credits
  actor: asociado autenticado
  respuesta: solo creditos del asociado resuelto por la sesion/token
  auditoria: portal.credit_viewed
```

No publicar endpoints de afiliacion, documentos o creditos hasta definir protecciones, consentimiento y necesidad de negocio.
