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

## Importacion XLSX pendiente

Los endpoints de carga masiva de creditos y aportes quedan para el siguiente bloque. Deben usar `import_batches`, almacenar el Excel en storage privado, calcular hash de archivo, validar columnas y devolver resumen de creados, actualizados y rechazados.
