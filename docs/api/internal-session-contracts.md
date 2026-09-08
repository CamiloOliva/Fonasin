# Contratos internos con sesion Laravel

Estas rutas no son API publica externa. Son contratos usados por el frontend React actual contra Laravel con cookie de sesion, CSRF cuando aplica y autorizacion en servidor.

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

## Importacion XLSX de creditos

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
Formato: XLSX, maximo 5 MB
Auditoria: imports / import.completed o import.rejected
```

Columnas obligatorias:

```text
documento
linea_credito
valor_inicial
saldo_actual
plazo_meses
tasa_interes
valor_cuota
estado
```

Reglas:

- `documento` se usa solo para busqueda HMAC de asociado activo.
- `linea_credito` debe ser una linea aprobada.
- valores numericos no negativos.
- `plazo_meses` entero mayor a cero.
- `estado`: `active`, `settled` o `archived`.
- documento + linea duplicado dentro del archivo se rechaza por fila.
- un archivo ya importado para creditos se rechaza por hash.

Respuesta:

```json
{
  "data": {
    "id": "uuid",
    "import_type": "credits",
    "original_filename": "creditos.xlsx",
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

## Importacion XLSX de aportes

Plantilla:

```text
GET /admin/import-batches/templates/contributions
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Respuesta: attachment XLSX, no-store
```

```text
POST /admin/import-batches/contributions
Autenticacion: sesion Laravel
Middleware: auth, password.changed
Autorizacion: admin
Content-Type: multipart/form-data
Campo: file
Formato: XLSX, maximo 5 MB
Auditoria: imports / import.completed o import.rejected
```

Columnas obligatorias:

```text
documento
periodo
fecha_corte
tipo_aporte
valor
saldo_despues
estado
referencia
```

Reglas:

- `documento` se usa solo para busqueda HMAC de asociado activo.
- `periodo` y `fecha_corte` usan formato `YYYY-MM-DD`.
- `tipo_aporte`: `permanent_savings` o `voluntary_savings`.
- `estado`: `registered`.
- valores numericos no negativos.
- documento + tipo + periodo + referencia duplicado dentro del archivo se rechaza por fila.
- un archivo ya importado para aportes se rechaza por hash.
- una correccion con la misma referencia revierte el movimiento anterior y registra el nuevo movimiento para no perder historial.
