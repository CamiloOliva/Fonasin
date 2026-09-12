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
associates -> contribution_accounts, contribution_movements
users -> import_batches          un administrador registra una carga operativa
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
| `document_type` | varchar(20) | nullable; requerido para recuperacion de usuarios internos |
| `document_number_hash` | char(64) | HMAC-SHA256 con `DATA_HASH_PEPPER`; nullable y unico cuando existe |
| `document_number_encrypted` | text | nullable; numero cifrado |

### `roles` y `role_user`

Roles iniciales: `admin`, `reviewer`, `associate`. La tabla pivote permite asignar mas de un rol sin modificar el modelo de usuarios.

### `associates`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK nullable y unico; se asigna cuando existe cuenta de portal |
| `document_type` | varchar(20) | tipo de identificacion |
| `document_number_hash` | char(64) | HMAC-SHA256 con `DATA_HASH_PEPPER`; unico; permite buscar sin exponer el numero |
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
| `status` | varchar(30) | `draft`, `submitted`, `under_review`, `pending_correction`, `approved`, `enabled`, `disabled`, `withdrawn`, `rejected`, `cancelled` |
| `current_step` | varchar(30) | etapa visible al solicitante: `personal`, `employment`, `financial`, `beneficiaries`, `sarlaft`, `documents`, `consents`, `summary` |
| `access_token_hash` | char(64) | hash del token tecnico del borrador; nullable y se limpia al cerrar la solicitud |
| `submitted_at` | timestamptz | nullable |
| `reviewed_by_user_id` | UUID | FK nullable |
| `reviewed_at` | timestamptz | nullable |
| `rejection_reason` | text | nullable |

Solo puede existir un borrador activo (`status = draft`) por asociado. Antes de crear el indice parcial, la migracion cancela borradores duplicados antiguos y conserva el mas reciente. En produccion esta migracion requiere respaldo, reporte de borradores afectados y aprobacion funcional antes de ejecutarse.

### `application_sections`

Una fila por etapa de formulario: `personal`, `employment`, `financial`, `beneficiaries` y `sarlaft`. Los pasos `documents`, `consents` y `summary` coordinan otras tablas o vistas y no se guardan en `application_sections`.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `application_id` | UUID | FK |
| `section` | varchar(40) | unico por solicitud |
| `schema_version` | integer | version de campos aprobados |
| `data_encrypted` | text | datos cifrados de la etapa |
| `completed_at` | timestamptz | nullable |

Esta tabla permite ajustar campos pendientes sin romper solicitudes creadas con una version anterior. Los campos finales que necesiten reportes se normalizaran despues de su aprobacion funcional.

El caso de uso de guardado recibe datos estructurados y delega el cifrado a `App\Infrastructure\Security`; no debe aceptar payloads cifrados desde capas externas ni persistir datos en texto plano. Una seccion solo puede marcarse como completada cuando el backend valida sus campos minimos; las secciones parciales pueden guardarse sin `completed_at`.

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

La carga de documentos registra metadatos, genera una `storage_key` privada desde `App\Infrastructure\Storage` y persiste el archivo en el disco privado `local`. La aplicacion no acepta rutas publicas ni claves de almacenamiento enviadas por el navegador. Al reemplazar un documento del mismo tipo, el anterior se archiva y se conserva como historial. Para envio inicial se exigen los documentos `identity` (documento de identidad por ambos lados en un solo PDF) y `employment_certificate` (certificado laboral en PDF), ambos en estado `uploaded`.

Al enviar una afiliacion, el backend genera dos documentos PDF privados adicionales: `affiliation_summary` y `payroll_authorization`. Estos documentos se crean desde datos descifrados solo dentro del caso de uso de envio, se guardan con `storage_key` privada y se auditan como `document.generated`. El mes y ano de inicio de descuentos queda pendiente de captura explicita en el formulario.

### `consent_records`

Registra evidencia de aceptacion sin depender de que una politica cambie despues.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `application_id` | UUID | FK |
| `consent_type` | varchar(50) | catalogo de dominio inicial: `data_processing`, `bylaws` |
| `policy_version` | varchar(50) | version exacta aceptada |
| `accepted_at` | timestamptz | obligatorio |
| `ip_hash` | char(64) | HMAC-SHA256 nullable; no se conserva la IP sin necesidad |

Una solicitud solo puede registrar una aceptacion por tipo y version de politica. Una nueva version permite una nueva aceptacion sin perder el historial anterior. Para envio se requieren `data_processing` y `bylaws` aceptados en la version de politica vigente.

## Creditos

### `credit_accounts`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `associate_id` | UUID | FK |
| `credit_line` | varchar(120) | linea de credito |
| `promissory_note_number_hash` | char(64) nullable | HMAC unico para identificar el pagare |
| `promissory_note_number_encrypted` | text nullable | numero de pagare cifrado |
| `initial_balance` | numeric(14,2) | mayor o igual a cero |
| `current_balance` | numeric(14,2) | mayor o igual a cero |
| `term_months` | integer nullable | mayor que cero cuando se informa |
| `interest_rate` | numeric(7,4) nullable | tasa registrada cuando se informa |
| `installment_amount` | numeric(14,2) | mayor o igual a cero |
| `last_payment_date` | date nullable | fecha del ultimo pago reportado |
| `status` | varchar(30) | `active`, `settled`, `archived` |
| `registered_by_user_id` | UUID | FK al administrador responsable |

Un asociado puede tener varios creditos. No se deben borrar; una correccion crea auditoria y un credito no vigente se archiva. Los casos de uso iniciales de Credits permiten registrar, actualizar campos existentes, archivar, importar desde XLSX y consultar creditos propios desde la sesion del asociado; no aceptan `associate_id` del navegador para consultas privadas. La importacion XLSX identifica cada obligacion por el HMAC unico del numero de pagare y valida que documento y nombre correspondan a un asociado activo. Cada alta o modificacion importada registra un evento del credito, correlacionado con el lote, con los nombres de los campos cambiados pero sin copiar valores financieros a auditoria.

## Aportes e importaciones

### `contribution_accounts`

Representa el saldo operativo de aportes por asociado. Es una cuenta por asociado y se actualiza desde movimientos; no reemplaza el historial.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `associate_id` | UUID | FK unico a `associates` |
| `contribution_balance` | numeric(14,2) | saldo de aportes ordinarios |
| `permanent_savings_balance` | numeric(14,2) | mayor o igual a cero |
| `voluntary_savings_balance` | numeric(14,2) | mayor o igual a cero |
| `total_balance` | numeric(14,2) | mayor o igual a cero |
| `status` | varchar(30) | `active`, `inactive` |
| `last_period` | date nullable | periodo operativo mas reciente |
| `last_cut_off_date` | date nullable | fecha de corte mas reciente |
| `last_movement_at` | timestamptz nullable | ultimo movimiento registrado |

### `contribution_movements`

Cada fila representa un movimiento historico de aportes. Las importaciones XLSX crean movimientos sin mezclar estos datos con `credit_accounts`. Cuando llega una correccion con la misma combinacion asociado, tipo, periodo y referencia, el movimiento registrado anterior se marca `reversed` y se crea uno nuevo para conservar trazabilidad. Al finalizar cada carga se reconstruyen los saldos de las cuentas afectadas desde todos sus movimientos `registered`; el orden de las filas del archivo no determina el resultado.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `contribution_account_id` | UUID | FK a cuenta de aportes |
| `associate_id` | UUID | FK a asociado para consultas e indices |
| `import_batch_id` | UUID nullable | FK a lote de importacion |
| `recorded_by_user_id` | UUID nullable | usuario que registro la operacion |
| `movement_type` | varchar(40) | `permanent_savings`, `voluntary_savings`, `contribution`, `adjustment` |
| `period` | date | periodo informado como primer dia del mes |
| `cut_off_date` | date | fecha de corte reportada |
| `amount` | numeric(14,2) | mayor o igual a cero |
| `balance_after` | numeric(14,2) | saldo despues del movimiento |
| `status` | varchar(30) | `registered`, `reversed` |
| `source` | varchar(30) | `manual`, `xlsx` |
| `reference` | varchar(120) | referencia operativa obligatoria sin datos sensibles |
| `source_row_hash` | char(64) | llave tecnica obligatoria de idempotencia por fila |
| `recorded_at` | timestamptz | momento de registro operativo |

### `import_batches`

Registra la trazabilidad de cargas masivas. El archivo se almacena de forma privada y el hash permite detectar repetidos sin confiar en el nombre original.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | PK |
| `imported_by_user_id` | UUID | FK al usuario administrador |
| `import_type` | varchar(40) | `credits`, `contributions`, `voluntary_savings`, `permanent_savings` |
| `original_filename` | varchar(255) | referencia visual, no ruta |
| `storage_key` | varchar(500) | ruta privada generada por servidor |
| `file_hash` | char(64) | hash del contenido del archivo |
| `mime_type` | varchar(120) | validado por servidor |
| `byte_size` | bigint | mayor a cero |
| `status` | varchar(40) | `pending`, `processing`, `completed`, `completed_with_errors`, `failed` |
| `rows_total` | integer | filas leidas |
| `rows_created` | integer | registros creados |
| `rows_updated` | integer | registros actualizados |
| `rows_rejected` | integer | filas rechazadas |
| `errors` | jsonb nullable | errores por fila sin datos sensibles |
| `started_at` | timestamptz nullable | inicio de procesamiento |
| `completed_at` | timestamptz nullable | fin de procesamiento |

Las cargas aceptan solo `.xlsx` con limites configurables de tamano, contenido descomprimido, filas, tiempo de procesamiento y memoria incremental; los valores iniciales son 5 MB, 64 MB descomprimidos, 5000 filas, 30 segundos y 64 MB de memoria incremental. `storage_key` y `file_hash` son internos y no se exponen por JSON. Los errores por fila no deben incluir documentos, correos ni valores sensibles en claro.

Hasta que FONASIN apruebe una regla institucional de conciliacion, `balance_after` se trata como el saldo reportado por la fuente. Para cada tipo de aporte, la cuenta toma el saldo del movimiento `registered` con periodo y fecha de corte mas recientes. Esta regla tecnica evita resultados dependientes del orden del XLSX, pero no reemplaza la aprobacion funcional pendiente.

## Convenciones de migracion

- Crear una migracion por cambio logico, con nombre descriptivo.
- Agregar primero columnas o tablas nuevas; migrar datos; cambiar codigo; retirar elementos obsoletos en una migracion posterior.
- Para importes monetarios usar `numeric`, nunca `float`.
- Definir FKs y reglas `on delete` deliberadamente. En datos historicos preferir impedir la eliminacion.
- Crear indices para FKs, busquedas por estado/fecha y consultas frecuentes del portal.
- Un seeder no contiene datos reales ni se ejecuta en produccion sin aprobacion expresa.

## Reglas de dominio iniciales

Affiliation valida sus estados mediante `App\Domain\Affiliation`. Las transiciones iniciales son:

- `draft` -> `submitted` o `cancelled`.
- `submitted` -> `under_review`.
- `under_review` -> `pending_correction`, `approved` o `rejected`.
- `pending_correction` -> `submitted` o `cancelled`.
- `approved` -> `enabled` o `pending_correction`.
- `enabled` -> `disabled` o `withdrawn`.
- `disabled` -> `enabled` o `withdrawn`.
- `withdrawn`, `rejected` y `cancelled` son terminales.

El caso de uso inicial de envio exige las secciones de formulario completas, los documentos obligatorios y los consentimientos obligatorios para la version de politica vigente antes de aplicar `draft` -> `submitted`.

## Decisiones funcionales pendientes

1. Momento exacto en que se crea `users` para un asociado.
2. Ajustes finales de campos obligatorios de cada etapa de afiliacion cuando el formulario sea aprobado por negocio.
3. Catalogo final de documentos obligatorios y sus limites de archivo.
4. Regla de correccion, archivo y vigencia de un credito.
5. Retencion aprobada para solicitudes, documentos y eventos de auditoria.
6. Catalogos definitivos y si su integridad se aplica solo en dominio o tambien mediante restricciones de base de datos.
7. Moneda, fechas, limites de tasa y demas invariantes financieras de `credit_accounts`.
8. Aprobacion institucional final de las cuatro plantillas XLSX y de sus reglas de operacion.
9. Regla final para calcular y reconciliar saldos de aportes cuando una carga corrige periodos anteriores.

## Contenido y FPQRS

- `carousel_assets`: entidad propuesta para imagen, texto alternativo, enlace, orden, estado y publicacion. No existe migracion/modelo en el alcance actual.
- `convenios`: entidad propuesta para nombre, categoria, logo, contenido y estado de publicacion. No existe migracion/modelo en el alcance actual.
- `fpqrs_submissions`: nombre, correo, hash HMAC del correo, tipo, mensaje, adjunto opcional en storage privado, estado de entrega de correo y fecha. No implementa radicado ni seguimiento publico. Nombre, correo, mensaje y adjunto permanecen en claro para operacion interna; antes de produccion se debe aprobar finalidad, retencion, responsable y procedimiento de eliminacion/anonimizacion si aplica.

## Indices minimos

- `users(email)` unico.
- `users(document_number_hash)` unico parcial cuando el hash no es nulo.
- `associates(document_number_hash)` unico.
- `affiliation_applications(status, created_at)`.
- `affiliation_applications(associate_id)` unico parcial cuando `status = draft` y `associate_id` no es nulo.
- `application_documents(application_id, status)`.
- `credit_accounts(associate_id, status)`.
- `contribution_accounts(associate_id)` unico.
- `contribution_movements(associate_id, period)`.
- `contribution_movements(contribution_account_id, recorded_at)`.
- `import_batches(import_type, status, created_at)`.
- `import_batches(import_type, file_hash)` unico.
- `audit_events(subject_type, subject_id, occurred_at)`.
- `audit_events(actor_user_id, occurred_at)`.
- `auth_events(user_id, occurred_at)`.
- `auth_events(event_type, occurred_at)`.
