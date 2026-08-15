# Desarrollo local y ramas

## Ramas

```text
feature/* -> develop -> main
```

- `feature/*`: trabajo aislado por cambio funcional.
- `develop`: integracion y pruebas en el subdominio de desarrollo.
- `main`: codigo aprobado para produccion.

## Reglas

- No hacer desarrollo directo en `main`.
- Cada cambio incluye pruebas proporcionales y actualizacion de documentacion si cambia una decision o modelo de datos.
- Las migraciones se revisan como parte de la pull request.
- Los datos reales no se usan en desarrollo.

## Estado del repositorio

La rama local activa es `develop`. Debe publicarse cuando la cuenta autenticada disponga de permiso de escritura sobre el repositorio remoto.
