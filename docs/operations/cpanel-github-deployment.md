# Despliegue automático de `main` a cPanel

El workflow `.github/workflows/quality-gates.yml` construye el frontend React/Vite en GitHub Actions. Cuando el commit llega a `main`, primero ejecuta las pruebas de backend SQLite y PostgreSQL, las pruebas de frontend, el build y las comprobaciones de Apache. Solo si todo termina correctamente puede publicar `dist/` en el document root de cPanel.

## Configuración requerida en GitHub

En **Settings > Secrets and variables > Actions** configurar:

### Variable de repositorio

| Variable | Valor |
|---|---|
| `CPANEL_DEPLOY_ENABLED` | `true` |

La variable permite preparar el workflow sin activar todavía el despliegue.

### Secrets del entorno `production`

Crear un entorno llamado `production` y agregar:

| Secret | Descripción |
|---|---|
| `CPANEL_SSH_HOST` | Host SSH del servidor cPanel |
| `CPANEL_SSH_PORT` | Puerto SSH, normalmente `22` |
| `CPANEL_SSH_USER` | Usuario de la cuenta cPanel |
| `CPANEL_SSH_KEY` | Clave privada SSH autorizada por cPanel |
| `CPANEL_DEPLOY_PATH` | Ruta absoluta del document root, por ejemplo `/home/usuario/public_html` |

Nunca guardar contraseñas, claves privadas ni `.env` en el repositorio. La clave pública se registra en **cPanel > SSH Access > Manage SSH Keys**.

## Flujo de publicación

```text
push main
  -> quality gates SQLite + PostgreSQL + frontend
  -> artifact dist.tar.gz
  -> conexión SSH
  -> publicación en CPANEL_DEPLOY_PATH
  -> Apache sirve el nuevo build
```

El backend Laravel no se publica con este job. Su document root debe apuntar a `backend/public/` y requiere una estrategia separada para PHP, Composer, `.env`, migraciones y PostgreSQL.

## Primera activación

1. Confirmar que la cuenta puede conectarse por SSH con la clave configurada.
2. Confirmar que `CPANEL_DEPLOY_PATH` apunta al dominio principal, no a la carpeta personal.
3. Verificar manualmente que el usuario pueda crear `.deploy/` dentro de esa ruta.
4. Configurar los secrets del entorno `production`.
5. Cambiar `CPANEL_DEPLOY_ENABLED` a `true`.
6. Hacer un push aprobado a `main` y revisar el job **Deploy frontend to cPanel Apache**.

El job no elimina archivos existentes del document root; copia el build aprobado y conserva archivos previos para reducir el riesgo de pérdida accidental. La limpieza controlada de assets antiguos se puede añadir después de validar el primer despliegue.
