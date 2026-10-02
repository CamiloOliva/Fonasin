# Manual basico de operacion — FONASIN

Estado: borrador tecnico para capacitacion y validacion de FONASIN. No equivale
a acta de recibo ni contiene credenciales o datos de asociados.

## Acceso y roles

- El personal autorizado ingresa por `/admin-fonasin`. El asociado ingresa por
  `/portal-asociado`. No compartir cuentas ni contrasenas.
- Una clave inicial debe cambiarse antes de usar funciones privadas. La
  recuperacion depende del correo configurado para produccion.
- `admin` carga archivos y decide solicitudes; `reviewer` consulta los
  registros permitidos sin importar ni aprobar; `associate` consulta solo sus
  datos y puede solicitar ahorro voluntario si su perfil esta habilitado.
- Cerrar sesion al terminar, especialmente en equipos compartidos.

## Afiliacion digital

1. El aspirante diligencia `/afiliacion`, acepta los consentimientos vigentes,
   descarga la autorizacion de descuento, carga los soportes y envia.
2. En `/admin-fonasin`, consultar la solicitud, sus secciones y documentos.
   Revisar la identidad y los soportes antes de aprobar, rechazar o pedir
   correccion. La habilitacion de un asociado es un paso administrativo
   separado; no considerar un formulario enviado como afiliacion aprobada.
3. Descargar documentos solo desde las acciones autenticadas del panel. No
   reenviar enlaces de sesion ni copiar archivos privados a `public_html`.

## Importaciones operativas

1. En `Importaciones`, seleccionar el concepto correcto: asociados, cartera,
   aportes, ahorro permanente o ahorro voluntario. Descargar **esa** plantilla.
2. Preparar un XLSX por concepto. Mantener el documento y las fechas tal como
   indica la plantilla; no añadir columnas privadas ajenas al contrato.
3. Cargar el archivo una sola vez y revisar el resultado y el reporte de filas
   rechazadas. Una carga con error no se debe reintentar a ciegas; corregir
   primero la fuente. Conservar el archivo institucional original en el
   repositorio seguro de FONASIN, no en Git.
4. Comparar una muestra de los saldos del panel con el archivo aprobado. El
   saldo importado representa el saldo a la fecha informada, no un abono a
   sumar de nuevo. La aprobacion de ahorro voluntario tampoco aumenta el
   saldo: este cambia al importar datos institucionales.

## Solicitud de ahorro voluntario

1. El asociado activo completa y obtiene habilitacion de su perfil personal y
   laboral. Si faltan datos requeridos para la libranza, el servidor rechaza
   la solicitud sin guardar un PDF incompleto.
2. En `Portal asociado > Ahorro voluntario`, indica el valor mensual, acepta
   la autorizacion y envia. Puede consultar su estado y descargar **su** PDF.
3. En `Admin FONASIN > Aportes y ahorros`, `admin` revisa la solicitud y la
   libranza, decide `Aprobar` o `Rechazar` y, si corresponde, registra la
   libranza firmada. `reviewer` no puede decidir ni cargar documentos.
4. Una solicitud rechazada conserva su historial; el asociado inicia otra
   solicitud nueva. No modificar ni borrar la anterior. La regla de una
   solicitud nueva **despues de una aprobacion** requiere decision de FONASIN
   antes de declararse cerrada.

## Publicaciones del sitio

El sitio no tiene CMS. Noticias y Balance social se publican mediante un
cambio revisado en `src/data/institutionalUpdates.ts`, con textos/documentos
aprobados por FONASIN. Los enlaces de redes se entregan al responsable del
build como variables `VITE_FACEBOOK_URL`, `VITE_INSTAGRAM_URL` y
`VITE_YOUTUBE_URL`. Si no se entregan, el sitio no muestra enlaces falsos.

## Incidentes y datos personales

- Si un saldo no coincide, detener nuevas cargas de ese concepto, guardar
  fecha, identificador del lote y archivo fuente institucional; no corregir
  directamente MariaDB.
- Si hay una solicitud o documento atribuido a otra persona, suspender el
  acceso afectado y escalar inmediatamente al responsable de datos. No enviar
  capturas con cedulas, PDF o contrasenas por canales informales.
- Antes de migraciones o cambios productivos, hacer respaldo verificable de
  MariaDB y archivos privados; seguir `docs/operations/deployment.md`.

## Cierre de capacitacion

FONASIN debe confirmar destinatarios, fecha, temas vistos y resultado de una
prueba guiada con datos anonimizados. Ese registro de capacitacion y la
aprobacion de plantillas, textos y libranzas son evidencias externas pendientes.
