# Entornos y despliegue

## Entornos

| Entorno | Rama | Destino | Base de datos |
|---|---|---|---|
| Desarrollo | `develop` | `dev.tudominio.com` | PostgreSQL staging |
| Produccion | `main` | `tudominio.com` | PostgreSQL produccion |

Cada entorno usa su propio `.env`, base de datos, claves de cifrado y almacenamiento de documentos. Nunca se comparten credenciales ni archivos.

## Controles previos a produccion

1. Probar la rama en staging.
2. Ejecutar pruebas automatizadas.
3. Realizar respaldo verificable de PostgreSQL.
4. Revisar migraciones: deben ser compatibles hacia atras.
5. Aprobar la pull request a `main`.
6. Desplegar y ejecutar migraciones de forma controlada.
7. Verificar autenticacion, cargas documentales y funciones publicas.

No se configura despliegue automatico ni `.cpanel.yml` hasta confirmar usuario de cPanel, rutas reales, version de PHP, Composer, Node y disponibilidad de PostgreSQL.
