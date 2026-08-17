# Estrategia de contenedores y hosting

## Decision actual

Laravel y PostgreSQL ya funcionan localmente sin contenedores. Docker Compose se evaluara **solo para desarrollo local y pruebas automatizadas** si aporta reproducibilidad; no se usara en produccion mientras FONASIN permanezca en el hosting cPanel compartido actual.

## Evidencia del hosting actual

La cuenta de cPanel no dispone de `npm`, `sudo`, `apt` ni privilegios de administrador. Esto es normal en hosting compartido: el usuario de cPanel no instala paquetes del sistema ni opera el servicio Apache.

Apache ya sirve los archivos publicados en los document roots de cPanel. Para el frontend React/Vite, Apache solo necesita recibir la carpeta compilada `dist/`; no necesita ejecutar Node.js en produccion.

## Arquitectura operativa inicial

```text
Desarrollador / CI
  -> npm ci + npm run build
  -> artefacto dist/
  -> copia segura al document root de cPanel

Apache cPanel
  -> sirve archivos estaticos de dist/
```

| Rama | Destino | Contenido publicado |
|---|---|---|
| `develop` | equipo local | compilacion y pruebas locales |
| `main` | dominio principal | artefacto `dist/` aprobado |

## Docker Compose local propuesto

Si se adopta Docker Compose, el entorno local tendra servicios separados:

```text
app        Laravel + PHP
postgres   PostgreSQL de desarrollo
mailpit    correo de prueba (opcional)
```

El frontend puede seguir usando Vite local o integrarse posteriormente con Laravel/Inertia. Los volumenes de Docker son exclusivamente locales; nunca contienen datos personales reales.

## Composicion propuesta

```text
compose.yaml
  app: Laravel/PHP para desarrollo
  postgres: PostgreSQL local con volumen no versionado
  mailpit: servidor de correo de pruebas opcional
```

No agregar Redis, colas separadas, MinIO o servicios adicionales hasta que un caso de uso concreto lo requiera. El objetivo inicial es reproducibilidad, no emular toda la infraestructura de produccion.

### Ventajas

- versiones reproducibles de PHP y PostgreSQL;
- misma configuracion para todos los desarrolladores;
- pruebas sin tocar produccion;
- facilita inicializar colaboradores y CI;
- prepara una futura migracion a VPS o plataforma de contenedores.

### Limites

- aumenta el numero de herramientas locales que cada desarrollador debe conocer;
- requiere Docker Desktop/Engine y recursos de memoria;
- no sustituye las pruebas funcionales locales;
- las imagenes Docker no pueden ejecutarse en este cPanel sin que el proveedor habilite Docker y acceso administrativo.

## Regla para cPanel

No incluir `npm ci` ni `npm run build` en `.cpanel.yml` mientras Node.js no este habilitado por el proveedor. El build se ejecuta localmente o en CI, y cPanel recibe solo archivos estaticos listos para Apache.

Si el proveedor habilita Application Manager con Node.js, se evaluara esa opcion antes de modificar el flujo. No instalar paquetes del sistema ni intentar usar `sudo` desde la cuenta de cPanel.

## Regla para produccion

Docker en produccion solo se evaluara si FONASIN migra a un VPS o a una plataforma administrada con soporte de contenedores, observabilidad, backups y actualizaciones de seguridad. El hosting cPanel compartido actual sigue usando Apache para archivos estaticos y usara PHP cuando se apruebe el despliegue del backend Laravel.

## Despliegue posterior del backend

Laravel puede ejecutarse con Apache/PHP si el proveedor confirma PHP compatible, Composer, extensiones requeridas y acceso SSH. El codigo de `backend/` debe quedar fuera del document root y Apache debe apuntar unicamente a `backend/public/`.

Antes de activar Laravel en produccion se debe confirmar:

- version de PHP y disponibilidad de Composer;
- PostgreSQL habilitado y accesible;
- cron para `schedule:run` y colas si se requieren;
- ruta document root del dominio principal;
- almacenamiento privado fuera de la carpeta publica.
