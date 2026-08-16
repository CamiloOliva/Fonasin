# Modelo de datos PostgreSQL - version inicial

## Principios

- Las claves primarias son UUID.
- Las tablas operativas incluyen `created_at` y `updated_at` en UTC.
- Los datos de negocio se archivan mediante estado; no se eliminan de forma fisica desde la aplicacion.
- Los datos sensibles se cifran en la capa de aplicacion antes de persistirse.
- Los archivos se guardan en storage privado; PostgreSQL conserva sus metadatos y relaciones.
- Las restricciones, indices y relaciones se declaran en migraciones, no solo en validacion de interfaz.
- Los catalogos de estados se validan en dominio y se documentan antes de agregarse.

## Relaciones principales

```text
users <-> roles                 mediante role_user
users -> associates             una cuenta puede representar un asociado
associates -> credit_accounts   un asociado puede tener varios creditos
associates -> affiliation_applications
applications -> sections, documents, consent_records
users -> audit_events           un actor realiza una accion auditable
```

## Identidad y acceso

### `users`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `email` | varchar(255) | unico, normalizado |
| `password` | varchar(255) | hash de Laravel; nunca texto plano |
| `status` | varchar(30) | `pending`, `active`, `blocked` |
| `email_verified_at` | timestamptz | nullable |
| `last_login_at` | timestamptz | nullable |

### `roles` y `role_user`

Roles iniciales: `admin`, `reviewer`, `associate`. La tabla pivote permite asignar mas de un rol sin modificar el modelo de usuarios.

### `associates`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK nullable y unico; se asigna cuando existe cuenta de portal |
| `document_type` | varchar(20) | tipo de identificacion |
| `document_number_hash` | char(64) | unico; permite buscar sin exponer el numero |
| `document_number_encrypted` | text | numero cifrado |
| `full_name` | varchar(255) | nombre para operacion |
| `status` | varchar(30) | `applicant`, `active`, `inactive` |

## Afiliacion

### `affiliation_applications`

Representa la solicitud y sus metadatos operativos, no todos los datos sensibles.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `associate_id` | UUID | FK nullable mientras no exista asociado |
| `status` | varchar(30) | `draft`, `submitted`, `under_review`, `approved`, `rejected`, `cancelled` |
| `current_step` | varchar(30) | etapa visible al solicitante |
| `submitted_at` | timestamptz | nullable |
| `reviewed_by_user_id` | UUID | FK nullable |
| `reviewed_at` | timestamptz | nullable |
| `rejection_reason` | text | nullable |

### `application_sections`

Una fila por etapa: `personal`, `employment`, `financial`, `beneficiaries` y `sarlaft`.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `application_id` | UUID | FK |
| `section` | varchar(40) | unico por solicitud |
| `schema_version` | integer | version de campos aprobados |
| `data_encrypted` | text | datos cifrados de la etapa |
| `completed_at` | timestamptz | nullable |

Esta tabla permite ajustar campos pendientes sin romper solicitudes creadas con una version anterior. Los campos finales que necesiten reportes se normalizaran despues de su aprobacion funcional.

### `application_documents`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `application_id` | UUID | FK |
| `document_type` | varchar(50) | catalogo aprobado |
| `original_filename` | varchar(255) | solo referencia; no se usa como ruta |
| `storage_key` | varchar(500) | identificador privado generado por el sistema |
| `mime_type` | varchar(100) | validado en servidor |
| `byte_size` | bigint | limite por tipo documental |
| `status` | varchar(30) | `uploaded`, `accepted`, `rejected`, `archived` |
| `uploaded_at` | timestamptz | fecha de carga |

### `consent_records`

Registra evidencia de aceptacion sin depender de que una politica cambie despues.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `application_id` | UUID | FK |
| `consent_type` | varchar(50) | tratamiento de datos, declaracion u otro texto aprobado |
| `policy_version` | varchar(50) | version exacta aceptada |
| `accepted_at` | timestamptz | obligatorio |
| `ip_hash` | char(64) | nullable; no se conserva la IP sin necesidad |

## Creditos

### `credit_accounts`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `associate_id` | UUID | FK |
| `credit_line` | varchar(120) | linea de credito |
| `initial_balance` | numeric(14,2) | mayor o igual a cero |
| `current_balance` | numeric(14,2) | mayor o igual a cero |
| `term_months` | integer | mayor que cero |
| `interest_rate` | numeric(7,4) | tasa registrada |
| `installment_amount` | numeric(14,2) | mayor o igual a cero |
| `status` | varchar(30) | `active`, `settled`, `archived` |
| `registered_by_user_id` | UUID | FK al administrador responsable |

Un asociado puede tener varios creditos. No se deben borrar; una correccion crea auditoria y un credito no vigente se archiva.

## Convenciones de migracion

- Crear una migracion por cambio logico, con nombre descriptivo.
- Agregar primero columnas o tablas nuevas; migrar datos; cambiar codigo; retirar elementos obsoletos en una migracion posterior.
- Para importes monetarios usar `numeric`, nunca `float`.
- Definir FKs y reglas `on delete` deliberadamente. En datos historicos preferir impedir la eliminacion.
- Crear indices para FKs, busquedas por estado/fecha y consultas frecuentes del portal.
- Un seeder no contiene datos reales ni se ejecuta en produccion sin aprobacion expresa.

## Decisiones pendientes antes de la primera migracion

1. Momento exacto en que se crea `users` para un asociado.
2. Campos definitivos y obligatorios de cada etapa de afiliacion.
3. Catalogo de documentos obligatorios y sus limites de archivo.
4. Regla de correccion, archivo y vigencia de un credito.
5. Retencion aprobada para solicitudes, documentos y eventos de auditoria.

## Contenido y FPQRS

- `carousel_assets`: imagen, texto alternativo, enlace, orden, estado y publicacion.
- `convenios`: nombre, categoria, logo, contenido y estado de publicacion.
- `fpqrs_submissions`: nombre, correo, tipo, mensaje, adjunto opcional, estado de entrega de correo y fecha. No implementa radicado ni seguimiento publico.

## Indices minimos

- `users(email)` unico.
- `associates(document_number_hash)` unico.
- `affiliation_applications(status, created_at)`.
- `application_documents(application_id, status)`.
- `credit_accounts(associate_id, status)`.
- `audit_events(subject_type, subject_id, occurred_at)`.
