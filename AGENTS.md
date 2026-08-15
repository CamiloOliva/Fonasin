# Guia no negociable para agentes y desarrolladores

Este archivo es de cumplimiento obligatorio para cualquier persona o agente que modifique FONASIN. Si una instruccion puntual entra en conflicto con este archivo, pedir aclaracion antes de implementar, salvo que la instruccion del propietario del proyecto lo autorice expresamente.

## 1. Objetivo y alcance

FONASIN evoluciona desde un sitio React/Vite hacia una plataforma institucional con:

- sitio publico;
- afiliacion digital;
- portal privado del asociado;
- administracion interna limitada;
- PostgreSQL, documentos privados y trazabilidad.

El alcance vigente no incluye un CMS general, pasarela de pagos, integraciones con nomina/ERP, firma digital certificada, aplicacion movil nativa ni un sistema FPQRS con radicado y seguimiento. No agregar ninguno de estos elementos sin aprobacion escrita y, si aplica, ajuste formal de alcance.

## 2. Estado actual y transicion

- El sitio actual funciona con React, TypeScript, Vite y Tailwind en `src/`.
- Aun no existe una aplicacion Laravel ni una base PostgreSQL creada.
- Las carpetas `app/`, `database/`, `resources/`, `storage/` y `tests/` son el esqueleto objetivo; no asumir que ya contienen infraestructura Laravel funcional.
- La migracion de React hacia `resources/js/` sera incremental. No mover ni reescribir pantallas existentes por motivos cosmeticos. Cada traslado debe mantener rutas, comportamiento y compilacion.

## 3. Arquitectura obligatoria

La arquitectura objetivo es un **monolito modular**:

```text
Presentacion -> HTTP -> Aplicacion -> Dominio -> Infraestructura
```

### Reglas de dependencia

1. React/Inertia y Filament son presentacion: muestran datos y envian acciones; no contienen reglas de negocio sensibles.
2. Controladores, rutas y Form Requests autentican, autorizan y validan; no implementan flujos complejos ni persisten reglas de negocio directamente.
3. Los casos de uso de `app/Application/` coordinan operaciones completas y transacciones.
4. `app/Domain/` contiene estados, reglas y eventos del negocio; no debe depender de HTTP, React, Filament, cPanel, SQL concreto ni proveedores externos.
5. `app/Infrastructure/` implementa PostgreSQL, almacenamiento, correo, auditoria y adaptadores externos.
6. Nunca saltar una capa por rapidez. Un componente React no consulta PostgreSQL; un controlador no accede directamente a storage; un modulo no modifica tablas de otro modulo sin pasar por un caso de uso definido.

## 4. Limites de modulos

| Modulo | Es propietario de | No debe controlar |
|---|---|---|
| Identity | usuarios, roles, autenticacion, recuperacion de acceso | creditos, documentos de afiliacion |
| Affiliation | solicitudes, etapas, documentos, consentimiento, revision | autenticacion o logica de creditos |
| Credits | creditos, cuotas, saldos, tasas, carga administrativa | perfiles, roles o solicitudes |
| Portal | vista autorizada del asociado | administracion de contenido publico |
| FPQRS | formulario, adjunto opcional y entrega al correo institucional | radicado o seguimiento publico |
| Content | carrusel, convenios y contenido expresamente autorizado | CMS completo |

Si un modulo necesita una accion de otro, crear o reutilizar un caso de uso o evento de dominio. No copiar logica ni usar consultas SQL cruzadas como atajo.

## 5. Reglas no negociables de datos

1. PostgreSQL es la unica fuente de verdad para datos operativos. No persistir informacion de negocio en `localStorage`, archivos JSON del frontend ni variables de entorno.
2. Usar UUID como clave primaria y `timestamptz` en UTC para fechas persistidas.
3. Toda modificacion de esquema se realiza con una migracion versionada. Nunca editar manualmente produccion con phpPgAdmin o SQL ad-hoc.
4. Las migraciones de produccion deben ser compatibles hacia atras: no borrar, renombrar o cambiar datos criticos en el mismo despliegue que introduce el reemplazo.
5. No eliminar fisicamente solicitudes, creditos, usuarios o documentos desde la aplicacion. Usar estados (`archived`, `inactive`, `cancelled`, etc.) y auditar la accion.
6. Los datos sensibles de afiliacion y SARLAFT se cifran antes de persistirse. No se imprimen en logs, errores, pruebas, auditoria ni datos de ejemplo.
7. Los numeros de documento requieren un valor cifrado y un hash de busqueda unico; no exponerlos en URLs, mensajes o trazas.
8. Los archivos no se guardan dentro de PostgreSQL ni en `public/`. PostgreSQL guarda metadatos y una clave privada de storage.

El modelo de referencia esta en `docs/architecture/data-model.md`.

## 6. Auditoria obligatoria

Toda accion sensible o administrativa debe registrar un evento en `audit_events` dentro de la misma transaccion de negocio. La autenticacion y sus fallos se registran en `auth_events`.

Se deben auditar como minimo:

- envio, revision, aprobacion, rechazo y cancelacion de afiliaciones;
- carga, aceptacion, rechazo y descarga de documentos;
- creacion, edicion y archivado de creditos;
- cambios de roles, usuarios y permisos;
- acceso de un asociado a sus creditos;
- publicaciones o retiros del carrusel;
- inicio y fallo de sesion, recuperacion de clave y segundo factor.

Reglas:

- Auditoria solo de insercion: ni Filament ni una ruta normal deben editar o borrar eventos.
- `metadata` debe contener valores redactados y contexto tecnico minimo.
- Prohibido registrar contrasenas, tokens, numeros de documento, contenido SARLAFT, contenido completo de FPQRS o documentos.
- Usar `actor_user_id`, `subject_type`, `subject_id`, `action`, `occurred_at` y `correlation_id` cuando aplique.

Consultar `docs/architecture/audit.md` antes de añadir una accion con impacto de datos.

## 7. Seguridad y privacidad

1. Toda ruta de portal exige autenticacion; toda accion requiere una policy o permiso explicito.
2. Un asociado solo puede consultar sus propios datos. Nunca aceptar un `associate_id` del navegador como autorizacion.
3. Los administradores usan privilegio minimo; las funciones administrativas no se exponen al sitio publico.
4. Validar en servidor todos los datos y archivos: lista permitida de tipos, tipo real, tamano y nombre generado por el sistema.
5. Los documentos se descargan o visualizan mediante una ruta autorizada y temporal, nunca con una URL publica persistente.
6. Secretos, claves de cifrado, credenciales de base de datos y correos no se versionan. Usar `.env` local y secretos del entorno.
7. No usar datos personales reales en desarrollo, pruebas, capturas, seeds o staging.

## 8. Frontend y experiencia

- Conservar la compilacion Vite actual en cada cambio mientras Laravel no este inicializado.
- Organizar codigo nuevo por modulo en `src/modules/` y, tras la migracion, en `resources/js/`.
- Mantener componentes compartidos libres de reglas de negocio.
- Los estados de carga, error, vacio y sin permisos son obligatorios para formularios y pantallas privadas.
- No crear placeholders que aparenten una funcion terminada. Identificar claramente las funciones pendientes.

## 9. API e integraciones

- La primera version web usa rutas Laravel/Inertia y sesion; no crear API publica por anticipacion.
- Si se aprueba una integracion o aplicacion movil, crear endpoints bajo `/api/v1` y documentarlos con OpenAPI en `docs/api/`.
- Reutilizar los mismos casos de uso del dominio. No duplicar validacion ni reglas en controladores API.
- Cualquier integracion de nomina, ERP, pagos, firma certificada, CRM o proveedor externo requiere aprobacion de alcance, responsable, credenciales, estrategia de error y auditoria.

## 10. Pruebas y calidad

Antes de confirmar cambios:

1. Ejecutar la compilacion o las pruebas aplicables.
2. Verificar que no existan secretos, archivos privados o datos personales en Git.
3. Ejecutar `git diff --check`.
4. Actualizar documentacion si cambia arquitectura, modelo de datos, auditoria, despliegue o una decision de alcance.
5. Incluir pruebas para toda regla de negocio nueva: casos validos, permisos y errores previsibles.

Al iniciar Laravel, usar:

```text
tests/Unit/       # Reglas puras de dominio
tests/Feature/    # Casos de uso, HTTP, permisos y persistencia
tests/Browser/    # Flujos criticos: afiliacion, portal y administracion
```

## 11. Ramas y despliegue

```text
feature/* -> develop -> main
```

- `develop` es la rama de integracion y se prueba en el subdominio de staging.
- `main` representa produccion y solo recibe cambios mediante una pull request aprobada.
- Staging y produccion usan bases, storage, claves y `.env` diferentes.
- Nunca ejecutar migraciones, seeds destructivos ni pruebas contra produccion sin respaldo verificable y aprobacion explicita.
- No configurar `.cpanel.yml` con rutas inventadas. Las rutas de cPanel deben confirmarse antes de versionar configuracion de despliegue.

## 12. Cambios que requieren detenerse y pedir aprobacion

Pedir aprobacion antes de:

- agregar una integracion, proveedor externo o costo recurrente;
- modificar el alcance contractual;
- alterar datos reales, ejecutar migraciones de produccion o publicar cambios;
- introducir pagos, firma digital, biometria, notificaciones masivas, CMS completo o seguimiento FPQRS;
- cambiar la estrategia de autenticacion, cifrado, almacenamiento de documentos o retencion;
- eliminar o exponer datos, documentos o eventos de auditoria.

## 13. Lista de entrega

Un cambio esta listo solo si:

- respeta los limites del modulo;
- no rompe la compilacion ni las rutas existentes;
- valida y autoriza en servidor;
- deja auditoria cuando corresponde;
- incluye migracion segura y pruebas cuando toca datos;
- actualiza los documentos afectados;
- se reviso en `develop` antes de llegar a `main`.
