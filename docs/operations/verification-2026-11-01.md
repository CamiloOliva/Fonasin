# Reauditoria de creditos y dependencias

Fecha: 2026-11-01. Base: 0414b16. Rama local:
`codex/manual-credit-balances-payment-date`. Complementa la evidencia del
31 de octubre; no representa despliegue, CI remoto ni aceptacion del cliente.

## Hallazgos reproducidos y corregidos

1. Precision HTTP: numeric aceptaba escalas no representables, exponentes y
   floats. Antes de corregir, 17 de 32 casos nuevos fallaban. POST/PATCH ahora
   exigen cadenas decimales canonicas o enteros JSON exactos; se prueban tambien
   literales JSON que ya pierden precision al decodificarse. No se redondea un
   dato invalido ni se crea un evento de exito por un rechazo de validacion.
2. PATCH permitia una linea ajena al catalogo y DATE podia recibir anos menores
   al rango de MariaDB. El enum se comparte con el importador y se valida el
   rango de almacenamiento, sin inventar una regla sobre fechas futuras.
3. Los casos de uso modificaban instancias previas a la transaccion. Tres casos
   nuevos de dos procesos fallaban sin bloqueo. El primer ajuste tambien revelo
   un deadlock entre archivado e importacion, que revertia el archivado. El orden
   definitivo es asociado y despues credito, releyendo el estado bajo bloqueo.
   Las tres pruebas exigen espera real InnoDB, resultado de negocio, saldo,
   fecha, estado final y auditoria, incluido rechazo al importar un archivado.
4. El formulario permitia varios envios pendientes. Un ref sincrono y estado
   pendiente bloquean reenvios y edicion mientras espera, restauran el reintento
   tras error y conservan los valores. Se impide arrastrar texto ambiguo a los
   saldos, ademas de la guarda de pegado. No hay idempotencia entre dispositivos.
5. Las consultas de avisos de dependencias encontraron symfony/mime vulnerable
   y cuatro paquetes npm afectados directa o transitivamente. Se actualizaron
   lockfiles sin cambiar rangos raiz ni versiones mayores: Mime 7.4.22,
   Vite 7.3.7, Vitest/mocker 4.1.12, Undici 8.12.3 y dependencias compatibles.
   Los avisos de herramientas de desarrollo no prueban que Apache estatico
   estuviera exponiendo sus servidores de desarrollo.

Referencias oficiales consultadas:

- [Symfony CVE-2026-45070](https://symfony.com/blog/cve-2026-45070-email-header-injection-via-non-token-characters-in-mime-parameter-names).
- [Vitest GHSA-qxg6-89mg-rqv8](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8).
- [Undici GHSA-2m5v-pch6-74hx](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx).
- [Vite GHSA-9jrq-w75r-8gcw](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw).

## Evidencia final de suites y herramientas

- MariaDB local, corrida completa exclusiva: 583 pruebas aprobadas, 3737
  aserciones, cero saltos y cero fallos. Incluye permisos, titularidad,
  documentos privados, FPQRS, importaciones y flujos existentes.
- SQLite, despues de terminar MariaDB: 583 casos, 554 aprobados y 29 saltados,
  3616 aserciones, cero fallos. Los saltos no se presentan como pruebas de InnoDB.
- Frontend, instalacion limpia desde lockfile actualizado en Linux local:
  159 pruebas aprobadas, 21 archivos, sin omisiones.
- TypeScript/Vite: compilacion aprobada. Sigue el aviso de chunks mayores a
  500 kB; no se oculta ni se presenta como optimizacion realizada.
- Navegador Chrome contra compilacion y Laravel/MariaDB locales: seis recorridos
  aprobados en una sola corrida final, sin omisiones (221,84 segundos). Incluyen
  recuperacion y revocacion de sesiones, otrosi/importaciones/documentos privados,
  correccion de afiliacion, completar perfil, actualizar datos y registro manual.
  El nuevo recorrido verifica agrupacion visible, POST canonico, centavos, saldo
  cero, fecha persistida, reinicio del campo y consulta del titular. No usa mocks
  del backend. Tema existente: dos comprobaciones aprobadas, 1440 y 390 pixeles.
- Composer audit y npm audit: cero avisos de vulnerabilidad reportados en esta
  consulta. Eso no demuestra ausencia universal de vulnerabilidades.
- Composer validate y Pint: aprobados. Composer conserva el aviso general
  preexistente por la version exacta de dompdf; no es un aviso de vulnerabilidad.
- Instalacion local regenerada desde lockfiles: npm ci y Composer autoload
  completaron. Las clases duplicadas de Flysystem en vendor antiguo desaparecieron
  al reinstalar esos dos paquetes en sus mismas versiones bloqueadas.

## Incidencias del metodo que no cuentan como evidencia final

Una primera ejecucion de SQLite y MariaDB simultaneas interferia con las mismas
carpetas de Storage::fake. Se detuvo SQLite y se repitieron ambas suites completas
en serie. Los resultados previos con fallos de archivos ausentes se descartan;
no se relajaron las aserciones de documentos historicos para ocultarlos.

Un worker de prueba Laravel podia imprimir una excepcion y acabar con codigo
cero. Ahora captura errores inesperados, sale con uno y la prueba exige ademas
marcadores positivos de resultado. Los errores del worker nunca cuentan como
operacion completada ni como mutacion de negocio demostrada.

Vite dev en Windows no respondio al navegador dentro del tiempo de navegacion.
La comprobacion de navegador usa la compilacion Linux real con preview local
y proxy a Laravel/MariaDB, sin ampliar tiempos ni simular respuestas de negocio.
El primer selector E2E nuevo exigia coincidencia exacta en una etiqueta que
incluye las opciones del select; se corrigio su localizacion, conservando el
asociado requerido. Ademas, ejecutar el registro manual antes de XLSX convertia
el caso de creacion esperado en una actualizacion de credito legado. El registro
manual se ejecuta despues; no se debilita la asercion rows_created de la carga.

No hay migraciones nuevas ni cambios en cPanel, SMTP productivo o datos reales.
La revision se centra en los ajustes de creditos y su regresion; no constituye
certificacion de seguridad de toda la plataforma ni aprobacion contractual.
