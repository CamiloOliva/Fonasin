# ADR-010: precision y serializacion de creditos

Fecha: 2026-11-01. Estado: aceptado para desarrollo.

## Contexto

El registro manual debe conservar centavos y fecha del ultimo pago sin depender
del formato visual. La validacion numeric por si sola acepta exponentes, floats
JSON y escalas que MariaDB puede redondear. Actualizar, archivar e importar un
credito debe observar su estado vigente dentro de la transaccion.

## Decision

- El HTTP interno admite cadenas decimales canonicas o enteros JSON exactos.
  Rechaza floats, exponentes, signos, agrupadores y escalas mayores a las de
  almacenamiento: dos decimales para dinero y cuatro para tasas. No cambia
  la interpretacion localizada independiente del lector XLSX.
- El catalogo existente se declara una vez en CreditLine y lo usan POST, PATCH
  e importacion. No se agregan lineas comerciales.
- Fecha del ultimo pago es opcional, YYYY-MM-DD, entre 1000-01-01 y 9999-12-31.
  Es el rango de almacenamiento, no una prohibicion nueva de fechas futuras.
- Los escritores bloquean asociado y despues credito, y releen el estado antes
  de modificarlo. Evita el orden inverso entre archivado y carga. Persistencia y
  auditoria permanecen en la misma transaccion.
- La pantalla conserva cadenas canonicas y muestra miles con punto y centavos
  con coma. Un bloqueo sincrono impide reenvios mientras la peticion esta pendiente;
  un error permite reintentar. No constituye idempotencia entre dispositivos.

## Verificacion y limites

Se prueban rechazo HTTP sin escritura ni auditoria falsa, controles positivos,
permisos, persistencia y dos procesos reales esperando en InnoDB. SQLite no
demuestra bloqueo de filas: esos casos se saltan expresamente en ese driver.
El orden compartido corrige la carrera medida; no promete ausencia de todo
deadlock posible en lotes que afecten multiples asociados. Un fallo transaccional
no puede contarse como operacion completada por una prueba ni por un consumidor.
No cambia el esquema ni se reescriben datos historicos.
