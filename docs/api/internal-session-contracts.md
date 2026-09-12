# Contratos internos con sesion Laravel

Estas rutas no son API publica externa. Son contratos usados por el frontend React actual contra Laravel con cookie de sesion, CSRF cuando aplica y autorizacion en servidor.

## Estado de cuenta consolidado del asociado

```text
GET /portal/account-statement
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Actor: usuario con asociado activo
Autorizacion: el asociado se resuelve desde la sesion; no se acepta associate_id del navegador
Auditoria: portal / portal.account_statement.viewed, mas los eventos internos de creditos y aportes
```

Respuesta sin datos:

```json
{
  "data": {
    "state": "empty",
    "generated_at": "2026-09-30T15:00:00.000000Z",
    "associate": {
      "id": "uuid",
      "full_name": "Persona Asociada",
      "document_type": "CC",
      "status": "active"
    },
    "credits": {
      "state": "empty",
      "total_current_balance": 0,
      "items": []
    },
    "contributions": {
      "state": "empty",
      "account": null,
      "movements": []
    }
  }
}
```

Respuesta con datos:

```json
{
  "data": {
    "state": "available",
    "generated_at": "2026-09-30T15:00:00.000000Z",
    "associate": {
      "id": "uuid",
      "full_name": "Persona Asociada",
      "document_type": "CC",
      "status": "active"
    },
    "credits": {
      "state": "available",
      "total_current_balance": 1200000,
      "items": [
        {
          "id": "uuid",
          "credit_line": "Libre inversion",
          "initial_balance": "1500000.00",
          "current_balance": "1200000.00",
          "term_months": 12,
          "interest_rate": "1.2000",
          "installment_amount": "125000.00",
          "status": "active"
        }
      ]
    },
    "contributions": {
      "state": "available",
      "account": {
        "id": "uuid",
        "permanent_savings_balance": "300000.00",
        "voluntary_savings_balance": "50000.00",
        "total_balance": "350000.00",
        "status": "active",
        "last_period": "2026-09-01",
        "last_cut_off_date": "2026-09-30",
        "last_movement_at": "2026-09-30T15:00:00.000000Z"
      },
      "movements": []
    }
  }
}
```

Errores:

- `401`: sesion ausente.
- `423`: debe cambiar contrasena temporal.
- `422`: usuario sin asociado o asociado inactivo.

## Consulta de aportes del asociado

```text
GET /portal/contributions
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Actor: usuario con asociado activo
Autorizacion: el asociado se resuelve desde la sesion; no se acepta associate_id del navegador
Auditoria: portal / contribution.viewed
```

Respuesta con modulo deshabilitado:

```json
{
  "data": {
    "state": "module_disabled",
    "account": null,
    "movements": []
  }
}
```

Respuesta sin datos:

```json
{
  "data": {
    "state": "empty",
    "account": null,
    "movements": []
  }
}
```

Respuesta con datos:

```json
{
  "data": {
    "state": "available",
    "account": {
      "id": "uuid",
      "associate_id": "uuid",
      "permanent_savings_balance": "150000.00",
      "voluntary_savings_balance": "50000.00",
      "total_balance": "200000.00",
      "status": "active",
      "last_period": "2026-09-01",
      "last_cut_off_date": "2026-09-30",
      "last_movement_at": "2026-09-30T15:00:00.000000Z"
    },
    "movements": [
      {
        "id": "uuid",
        "movement_type": "permanent_savings",
        "period": "2026-09-01",
        "cut_off_date": "2026-09-30",
        "amount": "200000.00",
        "balance_after": "200000.00",
        "status": "registered",
        "source": "manual",
        "reference": "REF-001",
        "recorded_at": "2026-09-30T15:00:00.000000Z"
      }
    ]
  }
}
```

Errores:

- `401`: sesion ausente.
- `423`: debe cambiar contrasena temporal.
- `422`: usuario sin asociado o asociado inactivo.

## Consulta administrativa de aportes

```text
GET /admin/contributions?associate_id=uuid&status=active&period=2026-09&page=1&per_page=25
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin o reviewer
Auditoria: contributions / contribution.account_collection.viewed
```

Los filtros son opcionales. `status` acepta `active` o `inactive`, `period` usa `YYYY-MM` y `per_page` admite de 1 a 100 registros. La respuesta contiene cuentas con datos publicables del asociado, saldos consolidados, fecha de corte, cantidad de movimientos y metadatos de paginacion. No expone documento cifrado, hash de documento ni hashes de filas importadas.

```text
GET /admin/contributions/{account}/movements?movement_type=permanent_savings&status=registered&period=2026-09&page=1&per_page=25
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin o reviewer sobre la cuenta
Auditoria: contributions / contribution.movement_collection.viewed
```

`movement_type` acepta `permanent_savings`, `voluntary_savings`, `contribution` o `adjustment`; `status` acepta `registered` o `reversed`. La respuesta incluye solamente movimientos pertenecientes a la cuenta indicada, el resumen de esa cuenta y metadatos de paginacion. El responsable se limita a identificador y correo institucional; `source_row_hash` nunca se expone.

Errores comunes:

- `401`: sesion ausente.
- `403`: rol sin permiso de backoffice.
- `404`: cuenta inexistente.
- `422`: filtro invalido.

## Historial de importaciones

```text
GET /admin/import-batches?type=contributions|credits&page=1&per_page=50
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin o reviewer para lectura
Auditoria: imports / import.viewed
```

Respuesta:

```json
{
  "data": [
    {
      "id": "uuid",
      "import_type": "contributions",
      "original_filename": "aportes.xlsx",
      "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "byte_size": 4096,
      "status": "completed_with_errors",
      "rows_total": 10,
      "rows_created": 8,
      "rows_updated": 1,
      "rows_rejected": 1,
      "errors": [
        {
          "row": 7,
          "message": "Documento no encontrado."
        }
      ],
      "started_at": "2026-09-30T15:00:00.000000Z",
      "completed_at": "2026-09-30T15:01:00.000000Z",
      "created_at": "2026-09-30T15:00:00.000000Z",
      "imported_by": {
        "id": "uuid",
        "email": "admin@example.test"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 50,
    "total": 1
  }
}
```

No se exponen `storage_key` ni `file_hash`.

## Reporte de errores de importacion

```text
GET /admin/import-batches/{batch}/errors
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin o reviewer
Respuesta: attachment CSV, no-store
```

Columnas del CSV:

```text
fila
error
```

El reporte usa los errores ya registrados en `import_batches.errors`. No incluye `storage_key`, `file_hash`, documentos, correos ni valores sensibles en claro.

## Importacion XLSX de cartera

Plantilla:

```text
GET /admin/import-batches/templates/credits
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Respuesta: attachment XLSX, no-store
```

```text
POST /admin/import-batches/credits
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Content-Type: multipart/form-data
Campo: file
Formato: XLSX, maximo configurable (5 MB por defecto)
Contenido descomprimido: maximo configurable (64 MB por defecto)
Filas: maximo configurable (5000 por defecto)
Auditoria: imports / import.completed o import.rejected
```

Columnas obligatorias:

```text
documento
nombre_completo
linea_credito
numero_pagare
valor_inicial
valor_cuota
saldo_actual
fecha_ultimo_pago
```

Reglas:

- `documento` se usa solo para busqueda HMAC de asociado activo.
- `nombre_completo` debe coincidir con el asociado del documento, ignorando mayusculas, espacios repetidos y tildes.
- `linea_credito` debe ser una linea aprobada.
- `numero_pagare` es obligatorio, se almacena cifrado y su HMAC unico identifica la obligacion que se debe actualizar.
- valores numericos no negativos.
- se aceptan formatos `1250.00`, `1250,00` y `1.250,00`.
- `fecha_ultimo_pago` usa formato `YYYY-MM-DD`.
- numero de pagare duplicado dentro del archivo se rechaza por fila.
- un archivo ya importado para creditos se rechaza por hash.
- cada credito creado o modificado registra auditoria correlacionada con el lote; se guardan nombres de campos cambiados, no valores financieros.

Respuesta:

```json
{
  "data": {
    "id": "uuid",
    "import_type": "credits",
    "original_filename": "cartera.xlsx",
    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "byte_size": 4096,
    "status": "completed_with_errors",
    "rows_total": 10,
    "rows_created": 8,
    "rows_updated": 1,
    "rows_rejected": 1,
    "errors": [
      {
        "row": 7,
        "message": "No existe un asociado activo para el documento informado."
      }
    ],
    "started_at": "2026-09-30T15:00:00.000000Z",
    "completed_at": "2026-09-30T15:01:00.000000Z",
    "created_at": "2026-09-30T15:00:00.000000Z",
    "imported_by": {
      "id": "uuid",
      "email": "admin@example.test"
    }
  }
}
```

## Importacion XLSX de aportes y ahorros

Plantilla:

```text
GET /admin/import-batches/templates/contributions
GET /admin/import-batches/templates/voluntary-savings
GET /admin/import-batches/templates/permanent-savings
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Respuesta: attachment XLSX, no-store
```

```text
POST /admin/import-batches/contributions
POST /admin/import-batches/voluntary-savings
POST /admin/import-batches/permanent-savings
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Content-Type: multipart/form-data
Campo: file
Formato: XLSX, maximo configurable (5 MB por defecto)
Contenido descomprimido: maximo configurable (64 MB por defecto)
Filas: maximo configurable (5000 por defecto)
Auditoria: imports / import.completed o import.rejected
```

Columnas obligatorias:

```text
documento
nombre_completo
valor_mensual
saldo
fecha_ultimo_pago
```

Reglas:

- `documento` se usa solo para busqueda HMAC de asociado activo.
- `nombre_completo` debe coincidir con el asociado del documento, ignorando mayusculas, espacios repetidos y tildes.
- el endpoint determina el tipo: aporte ordinario, ahorro voluntario o ahorro permanente; el navegador no lo envia dentro de cada fila.
- `fecha_ultimo_pago` usa formato `YYYY-MM-DD` y determina el periodo y la fecha de corte internos.
- valores numericos no negativos.
- se aceptan formatos `1250.00`, `1250,00` y `1.250,00`.
- el sistema genera una referencia tecnica estable a partir del tipo y la fecha de ultimo pago.
- documento + tipo + periodo + referencia duplicado dentro del archivo se rechaza por fila.
- un archivo ya importado para el mismo tipo de carga se rechaza por hash.
- una correccion del mismo asociado, tipo y fecha revierte el movimiento anterior y registra el nuevo para no perder historial.
- los saldos de las cuentas afectadas se reconstruyen al terminar la carga usando el movimiento registrado cronologicamente mas reciente de cada tipo, sin depender del orden de filas.
