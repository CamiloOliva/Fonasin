# ADR-007 - Correccion segura y unidades de cartera

Fecha: 2026-10-15. Estado: implementacion de los ajustes funcionales ya solicitados.

## Contexto

La reauditoria detecto tasas porcentuales reales de Excel interpretadas como
fracciones, falta de recorrido para devolver afiliaciones y dependencia de la
URL del convenio respecto al nombre de su imagen.

## Decisiones

- El lector conserva el formato numerico porcentual de Excel: una celda que
  muestra 18% y guarda 0.18 se entrega como 18%. Un decimal sin formato porcentual
  conserva su unidad original. NA y mv se importan separadas, sin calcularlas.
- `interest_rate_basis=monthly` identifica tasas mv nuevas, tanto manuales como
  importadas. Las anteriores quedan null y no se reinterpretan por heuristicas.
- Los importes de cartera se validan contra DECIMAL(14,2) antes de guardar.
  Una falla inesperada revierte los creditos del lote y lo termina como failed,
  con mensaje generico que no revela SQL ni datos financieros.
- `legacy_detail_slug` conserva la ruta del convenio independientemente del logo.
  El cambio de imagen mantiene la revision/publicacion explicita existente.
- La devolucion de afiliacion conserva la misma solicitud. Cada devolucion
  registra motivo cifrado, revisor, fecha, vencimiento, revocacion y reenvio en
  `application_corrections`. La auditoria registra referencias, no el motivo.
- El correo contiene un enlace firmado de 24 horas y un token aleatorio de 64
  caracteres en el fragmento; solo su hash se persiste. React retira el fragmento
  y conserva unicamente acceso tecnico en sessionStorage. El enlace anterior
  se revoca al reemitir o reenviar la solicitud. No se recupera un token enviado
  anteriormente ni se guarda informacion personal en el navegador.
- Correcciones de formularios de asociados requieren tambien sesion del
  propietario activo. Este puede reanudar su misma correccion desde el portal.
- Escrituras, reemision y decisiones bloquean la solicitud en transaccion. El
  reenvio genera nuevas versiones de PDF; los documentos anteriores se archivan.
  Cualquier autorizacion empresarial anterior se archiva al devolver o regenerar
  la libranza. La carga empresarial se permite solo sobre la revision aprobada
  vigente y una actualizacion de datos no genera nueva libranza.
- El fallo de entrega del correo revierte el cambio y permite volver a intentar.

## Verificacion

Las pruebas cubren porcentajes numericos reales y textuales, maximo decimal y
desborde, lote fallido sin datos filtrados, cambio de logo, tasa mv sin NA,
correccion/reenvio, token ausente o viejo, vencimiento, rotacion, fallo de correo,
propietario ajeno y conservacion de documentos/historial. El navegador local
agrega cartera con porcentajes reales, saldo total visible, PDF publico, convenio
editado y reenvio de afiliacion por el enlace de correo sintetico.

La aceptacion funcional y visual de FONASIN permanece separada de estas pruebas.
