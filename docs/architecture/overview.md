# Arquitectura objetivo

## Decision

FONASIN se construira como un monolito modular con Laravel, React/Inertia, Filament y PostgreSQL. Es un unico despliegue, pero cada area del negocio conserva limites claros. La primera fase conserva el React/Vite actual operativo; no se interrumpe el sitio para iniciar el backend.

## Objetivos de calidad

- mantener un unico despliegue manejable en el hosting Apache/cPanel;
- concentrar autenticacion, permisos, datos y auditoria en Laravel;
- permitir que nuevos modulos se agreguen sin duplicar reglas;
- preparar una API versionada solo cuando una integracion aprobada la necesite;
- separar datos sensibles, archivos privados y contenido publico.

## Capas

1. **Presentacion**: paginas React/Inertia para sitio publico, afiliacion y portal; Filament para administracion.
2. **HTTP**: rutas, controladores, middleware y Form Requests. Reciben solicitudes, autentican y validan entrada.
3. **Aplicacion**: casos de uso que coordinan una accion completa, por ejemplo `SubmitApplication` o `RegisterCredit`.
4. **Dominio**: reglas de negocio y transiciones de estado. No depende de React, Filament, correo ni cPanel.
5. **Infraestructura**: PostgreSQL, almacenamiento privado, correo, auditoria y servicios externos.

Las dependencias siempre avanzan hacia adentro: Presentacion -> HTTP -> Aplicacion -> Dominio. Solo Infraestructura conoce detalles de persistencia o proveedores.

## Flujo de una accion privada

```text
Asociado autenticado
  -> pagina React/Inertia
  -> ruta protegida de Laravel
  -> Form Request valida entrada
  -> policy autoriza el recurso
  -> caso de uso aplica regla del dominio
  -> transaccion PostgreSQL + auditoria
  -> respuesta segura para la interfaz
```

Una respuesta nunca incluye campos privados que la pantalla no necesita ni enlaces directos al storage.

## Modulos de dominio

| Modulo | Responsabilidad | No es responsable de |
|---|---|---|
| Identity | usuarios, roles, acceso y recuperacion de cuenta | datos financieros o de afiliacion |
| Affiliation | solicitud, etapas, documentos, consentimientos y revision | crear creditos |
| Credits | lineas, saldos, cuotas y carga administrativa de creditos | autenticar usuarios |
| Portal | informacion visible exclusivamente para el asociado autenticado | administrar contenido publico |
| FPQRS | captura, validacion y envio al canal institucional | sistema de radicacion o seguimiento publico |
| Content | carrusel y convenios autorizados | CMS general del sitio |

## Reglas de integracion

- Ningun componente React consulta PostgreSQL ni almacenamiento privado.
- Ningun modulo actualiza directamente tablas de otro modulo; usa un caso de uso o un evento de dominio.
- `web.php` sirve el sitio y el portal. `api.php` se reserva para una futura app movil o integraciones.
- Los documentos se entregan mediante una ruta autorizada de Laravel, no como URL publica.
- La administracion se limita al alcance aprobado: carrusel, solicitudes y creditos.
- Las reglas completas de propiedad y comunicacion se encuentran en `module-boundaries.md`.

## Estructura de codigo

```text
app/
  Application/       # Casos de uso y DTOs
  Domain/            # Entidades, reglas, estados y eventos
  Infrastructure/    # Persistencia, storage, correo y auditoria
  Http/              # Controllers, Requests y Middleware
database/
  migrations/        # Un cambio versionado por archivo
  seeders/           # Solo datos de desarrollo controlados
resources/js/
  Pages/             # Pantallas Inertia
  Components/        # Componentes reutilizables
  Layouts/           # Layout publico, portal y administracion
```

## Transicion desde el frontend actual

El frontend Vite existente en `src/` sigue operativo. Cuando se inicialice Laravel, sus paginas y componentes se migraran de forma incremental a `resources/js/`; no se reescribe la interfaz de una sola vez.

## Criterio para extraer un servicio futuro

Un modulo solo se separa del monolito si necesita despliegue independiente, escala claramente distinta, equipo propio o una integracion que justifique el costo operativo. Antes de eso, se conserva dentro del monolito modular y se protege con limites de codigo.
