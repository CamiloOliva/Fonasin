# ADR-004: Consulta privada e ingesta de los tres modulos del otrosi

Estado: aceptada como decision tecnica. No sustituye la aceptacion funcional de FONASIN.

## Contexto y alcance

Diego confirmo en esta conversacion la aprobacion del otrosi. Los tres conceptos
son aportes, ahorro permanente y ahorro voluntario. La solicitud de ahorro
voluntario es un tramite separado para un asociado existente, no una nueva
afiliacion ni una integracion automatica con nomina.

## Decision

- FONASIN carga XLSX separados por concepto. MariaDB conserva lotes, errores,
  movimientos historicos y saldos reconstruidos. El saldo del archivo es un
  saldo a la fecha indicada: no se suma nuevamente como si fuera un abono.
- Aprobar una solicitud no aumenta el saldo: el descuento efectivo solo se
  refleja cuando FONASIN importa el archivo correspondiente.
- El asociado consulta exclusivamente el perfil vinculado a su sesion. Ningun
  identificador enviado por el navegador selecciona otro titular.
- La solicitud conserva valor mensual, fecha, estado y decision. Rechazar no
  borra ni reabre el registro; el siguiente intento crea un UUID nuevo. Solo
  puede existir una solicitud pendiente por asociado, protegida tambien en DB.
- Admin importa y decide; reviewer consulta sin modificar; associate consulta
  sus datos, solicita y descarga su libranza. Las cuatro rutas propias de PDF
  exigen rol, asociado activo y propiedad, ademas de sesion y clave definitiva.
- PDF generado y firmado permanecen privados. La lectura usa un contrato de
  Application implementado por Infrastructure; Http transmite el stream tras
  la policy. Nunca devuelve la clave de almacenamiento ni un enlace publico.
- Mantener los componentes y tokens de estilo existentes. No agregar un
  segundo sistema visual ni un flujo de afiliacion duplicado.

## Garantias y evidencia exigida

Pruebas SQLite y MariaDB, regresiones de formato y rango monetario, permisos
negativos, rechazo/reintento, PDF real, CSRF renovado y navegador con sesiones
reales. El E2E solo permite localhost y fixtures en `fonasin_e2e`; nunca se
ejecuta contra cPanel. Un mock de servicio no demuestra persistencia ni login.

La guia `docs/operations/otrosi-local-validation.md` registra comandos y evidencia.
No se marca una entrega aceptada solo porque compila o responde HTTP 200.

## Fuera de esta decision

Firma certificada, conexion a nomina, pagos en linea, aprobacion automatica,
conciliacion bancaria y eliminacion automatica del historial. El contenido
juridico de la libranza y la aceptacion operativa corresponden a FONASIN.
