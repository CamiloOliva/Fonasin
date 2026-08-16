# Desarrollo local y ramas

## Ramas

```text
feature/* -> develop -> main
```

- `feature/*`: trabajo aislado por cambio funcional.
- `develop`: integracion y pruebas exclusivamente locales.
- `main`: codigo aprobado para produccion; Diego realiza el merge hacia esta rama.

## Reglas

- No hacer desarrollo directo en `main`.
- Antes de solicitar el merge, validar localmente compilacion, rutas y flujos afectados.
- Cada cambio incluye pruebas proporcionales y actualizacion de documentacion si cambia una decision o modelo de datos.
- Las migraciones se revisan como parte de la pull request.
- Los datos reales no se usan en desarrollo.

## Frontend actual

```bash
npm ci
npm run dev
npm run build
```

`npm run build` es obligatorio antes de solicitar un merge, porque verifica TypeScript y genera el bundle Vite.

## Flujo de cambio

1. Crear una rama `feature/<descripcion>` desde `develop`.
2. Implementar un cambio pequeno y coherente.
3. Ejecutar compilacion y pruebas aplicables.
4. Ejecutar `git diff --check` y revisar que no existan secretos o datos privados.
5. Actualizar documentacion si se toca arquitectura, datos, seguridad o despliegue.
6. Integrar la rama en `develop`.
7. Diego revisa y realiza el merge de `develop` hacia `main` cuando el cambio este listo para produccion.

## Backend futuro

Cuando se inicialice Laravel, agregar comandos reales de Composer, migraciones y pruebas a este documento. No inventar comandos ni ejecutar migraciones hasta que `backend/` exista y su `.env` local este configurado.

## Estado del repositorio

La rama local activa es `develop`. Debe publicarse cuando la cuenta autenticada disponga de permiso de escritura sobre el repositorio remoto.
