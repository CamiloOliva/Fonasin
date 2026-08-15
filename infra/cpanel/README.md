# Preparacion de cPanel

El proyecto tendra dos despliegues separados:

| Rama | Dominio | Uso |
|---|---|---|
| `main` | dominio principal | produccion |
| `develop` | subdominio de pruebas | staging |

No se ha creado aun un `.cpanel.yml` operativo porque requiere valores que no deben adivinarse: usuario de cPanel, rutas absolutas de ambos document roots, version de Node, version de PHP, Composer y disponibilidad de PostgreSQL.

## Configuracion esperada

1. Crear el subdominio de staging en cPanel.
2. Crear un segundo repositorio administrado por cPanel, apuntando al mismo remoto y con `develop` como rama activa.
3. Mantener el repositorio actual de produccion con `main` como rama activa.
4. Crear un `.env` distinto por entorno cuando exista Laravel.
5. Configurar una base PostgreSQL y almacenamiento de documentos distintos por entorno.

## Antes de activar el despliegue

Registrar en el ticket de infraestructura, sin incluir secretos en Git:

- dominio principal y subdominio exactos;
- usuario y ruta de cada document root;
- acceso SSH;
- salida de `node --version`, `npm --version`, `php --version` y `composer --version`;
- confirmacion de PostgreSQL en cPanel.
