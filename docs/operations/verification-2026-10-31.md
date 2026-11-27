# Ajustes de registro manual de creditos

Fecha de registro: 2026-10-31. Base: `0414b16`. Validacion de desarrollo local;
no implica despliegue ni aceptacion adicional de FONASIN.

## Solicitud y alcance

Carlos reporto revision productiva satisfactoria, incluida FPQRS. Ese reporte
es evidencia del cliente, no una nueva prueba SMTP ejecutada por nosotros.
Solicito puntos de miles en Saldo inicial/actual y Fecha del ultimo pago en
el registro manual, ya disponible por importacion de cartera.

- El formulario conserva sus estilos. Ambos saldos muestran puntos de miles
  y coma de centavos; el estado y la peticion contienen cadenas decimales sin
  separadores de miles. No se convierten a floats ni se recortan montos grandes.
- Se conserva la capacidad existente de DECIMAL(14,2), incluido saldo cero.
  El pegado de decimales con punto ambiguo se bloquea en lugar de multiplicarlos
  silenciosamente. El formato esperado se indica junto a los campos.
- Fecha del ultimo pago es opcional: un credito sin pagos puede conservar null.
  Se envia como YYYY-MM-DD, sin conversion a timestamp ni desplazamiento horario.
  No se introduce una restriccion nueva sobre fechas futuras que no exista en XLSX.
- POST y PATCH validan y persisten `last_payment_date`. PATCH sin ese campo lo
  conserva; null lo limpia. El listado administrativo y el portal lo consultan.
- Se mantiene autorizacion de admin, restricciones de asociado activo y credito
  archivado, y auditoria redactada. La fecha no se copia al evento de auditoria;
  reenviar la misma fecha no declara un cambio inexistente por el cast de Carbon.
- No hay migraciones: se reutiliza la columna y el cast existentes. El importador
  y sus encabezados no se modifican. El formulario limpia la fecha tras exito
  para no reutilizarla en otro credito, y conserva los datos ante error.

## Evidencia de regresion

- Antes de corregir backend: ocho casos fallaron por fecha ignorada o falta de
  validacion; el control de reviewer ya bloqueaba correctamente la escritura.
- Despues: 40 pruebas focalizadas aprobadas tanto en SQLite en memoria como
  en MariaDB local, 293 aserciones por corrida. Incluyen creditos HTTP y la
  suite de importacion XLSX, fechas imposibles/sufijos/formatos/tipos invalidos,
  persistencia, consulta del titular, auditoria y denegacion de reviewer.
- 75 pruebas frontend focalizadas aprobadas en Vitest vmThreads. Incluyen
  formato/límites/pegado, formulario controlado, envio real del componente a su
  servicio mockeado, saldo cero, fallback del saldo vacio, fecha, reinicio tras
  exito y conservacion ante error. No equivalen a un recorrido de navegador con
  backend real.
- Los intentos Windows con threads y forks fallaron al iniciar workers, antes
  de ejecutar pruebas; no se cuentan como verdes. El comando artisan no avanzo
  y se sustituyo por PHPUnit directo con base aislada explicita. No se quitaron
  aserciones ni se ampliaron tiempos de negocio para lograr el resultado.

## Corridas completas finales

- Backend MariaDB local: 547 pruebas aprobadas, sin saltos; 3367 aserciones.
- Backend SQLite: 547 casos, 521 aprobados y 26 saltados por condiciones del
  driver/entorno, sin fallos; 3294 aserciones.
- Frontend Linux local: 158 pruebas aprobadas en 21 archivos. Contenedor
  `node:22-alpine` ya disponible, Node 22.23.3, copia de fuentes sin `.env` y
  montaje original de solo lectura; dependencias instaladas desde el lockfile.
- TypeScript y Vite: compilacion aprobada dentro de ese entorno aislado. Persiste
  el aviso no bloqueante de chunks mayores de 500 kB; no se oculta ni se presenta
  como una optimizacion realizada.
- Una primera corrida completa frontend tuvo 155 aprobadas y un timeout de
  5 segundos en el caso nuevo que agrupaba tres flujos. Se dividio en tres
  pruebas independientes conservando las mismas aserciones y el timeout,
  y se repitio la suite completa: las 158 aprobaron. El codigo funcional no se
  cambio para acomodar ese timeout. La primera compilacion Windows se interrumpio
  y no cuenta como aprobada; la compilacion final Linux si termino.

No se ejecutaron pruebas ni modificaciones contra produccion, ni push o CI remoto.
La revision de navegador con backend real y la aceptacion del cliente de estos
dos ajustes no se deducen de pruebas UI con servicios mockeados.
