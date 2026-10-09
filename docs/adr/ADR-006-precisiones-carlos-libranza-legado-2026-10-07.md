# ADR-006 — Precisiones transmitidas por Carlos sobre libranza y asociados antiguos

Fecha: 7 de octubre de 2026. Estado: **parcial, uso y alcance numerico confirmados; contenido y procedimiento de firmas pendientes de aceptacion**. Fuente inicial: conversacion de WhatsApp aportada por Diego y foto de un formato fisico de FONASIN. El 8 de octubre Diego aporto el archivo digital `FORMATO DE AUTORIZACION DESCUENTO POR NOMINA - APORTES.docx` (SHA-256 `90495c9db389cb1c780f44df6e115e6ba9e1b66704e0c27ec19ca20cfb3c6bdd`). El original se conserva fuera del repositorio. El DOCX no declara numero de version ni fecha de vigencia. Bibian confirmo por escrito el 8 de octubre que para el asociado existente se genera **una nueva solicitud**, se usa **el mismo formato** y el valor autorizado corresponde **solo al ahorro voluntario, sin valor de aportes**.

## Definiciones transmitidas

1. Carlos informa que ningun credito requiere firma empresarial. La libranza de descuento por nomina se usa para afiliacion nueva (aporte obligatorio) y para un asociado ya afiliado que solicita iniciar ahorro voluntario. La cartera de creditos existente no debe adquirir una exigencia de libranza por esta precision. No se construye una solicitud de credito nueva.
2. FONASIN no tiene historial anterior de **solicitudes** de ahorro voluntario, segun Carlos. No se fabrican solicitudes ni firmas en seeds o migraciones. Esto no elimina saldos o movimientos de ahorro que FONASIN aporte mediante sus archivos de importacion. Antes del despliegue se debe verificar, con consulta de solo lectura, si la base destino contiene solicitudes creadas durante pruebas o versiones anteriores.
3. Los asociados antiguos tienen expedientes fisicos. Carlos informa que FONASIN no validara esos documentos para habilitar el portal y que revisara/aprobara la actualizacion de datos posterior al primer ingreso. `profile_completion` ya permite completar el perfil sin nueva afiliacion ni libranza. **No se elimina todavia el control de cédula para activar altas manuales/importadas:** antes debe quedar aprobado como se verifica la identidad y el correo de destino para conceder el primer acceso. El codigo y la matriz de requisitos siguen reflejando el control vigente.

## Formato de libranza: inventario para cotejo

El DOCX confirma encabezado, ciudad/fecha, destinatario de nomina, identidad y empleador, salario mensual, aporte obligatorio de 1,5 %, ahorro voluntario de valor fijo, total mensual, periodicidad, mes de inicio, autorizaciones y espacios de firma del solicitante y del pagador. Sus casillas `Aplica` y `No aplica` se refieren al ahorro voluntario. El documento no fija cifras ni fechas: son espacios para llenar. El texto fue leido estructuralmente del Word; el runtime de documentos de esta maquina no dispone de LibreOffice para verificar el render visual, por lo que no se afirma equivalencia de maquetacion.

| Punto de cotejo | PDF de afiliacion actual | PDF de solicitud posterior de ahorro voluntario actual | Accion antes de aceptacion |
|---|---|---|---|
| Conceptos y total | Incluye aporte obligatorio y ahorro voluntario; el valor voluntario puede ser `No aplica`. | Incluye solo el nuevo ahorro y total igual a ese monto. | **Resuelto por Bibian:** mismo formato para la solicitud posterior, sin valor de aportes; el total autorizado de esta solicitud es solo el nuevo ahorro voluntario. No sumar aportes vigentes. |
| Inicio de descuentos | Recibe mes/anio, hoy vacios y mostrados como por definir. | Muestra `Por definir con el pagador`. | Definir quien fija mes/anio y en que etapa; no inventar una fecha. |
| Aceptacion y firmas | Agrega bloque de aceptacion electronica del solicitante y deja espacio para firma del pagador. | Hace lo mismo, con un bloque distinto. | Confirmar que la aceptacion electronica cumple el procedimiento operativo de FONASIN; el formato Word tiene espacios para firmas manuales. |
| Texto de tratamiento y terminacion laboral | Cercano al DOCX, sujeto a cotejo final. | Ajustado a las clausulas del DOCX en el codigo local; conserva solo el concepto y total del nuevo ahorro. | Verificar PDF renderizado y obtener aceptacion de FONASIN; no atribuir aprobacion juridica automatica a la confirmacion de uso. |

Los PDF actuales son dos vistas separadas: `backend/resources/views/pdf/affiliation/payroll-authorization.blade.php` y `backend/resources/views/pdf/contributions/voluntary-savings-payroll-authorization.blade.php`. El caso de uso de ahorro voluntario entrega nombre, documento, lugar de expedicion, empleador, telefono, correo, salario, valor mensual, fecha y referencia al renderer. Las pruebas fijan ese contrato de datos, no aprueban por si solas el texto legal ni el diseno. Para cerrar el formato se debe:

En la solicitud posterior, el PDF no se rotula como firma electronica verificada ni presenta un codigo de verificacion sin mecanismo comprobable. El portal muestra la autorizacion antes del envio; el evento inmutable de solicitud registra la version del consentimiento aceptado. La aprobacion definitiva sigue siendo una decision administrativa sobre el PDF devuelto por el pagador, no una verificacion criptografica automatica.

1. Registrar la version y fecha de vigencia del archivo cuando FONASIN las suministre. La confirmacion escrita de Bibian cubre su uso en la solicitud posterior, pero no aprueba por si sola cada clausula ni el procedimiento de firmas. Conservar el original fuera del repositorio si incorpora firmas o datos reales.
2. Revisar con FONASIN el cotejo textual y visual de las dos vistas contra el DOCX. El ajuste local del PDF posterior reproduce las clausulas principales del archivo, pero no equivale a aceptacion final de todo el contenido.
3. Mantener la regla confirmada para la solicitud **posterior**: nueva solicitud, mismo formato, solo el valor nuevo de ahorro voluntario y total igual a este monto. La fila de aportes del DOCX no debe presentar un valor en este tramite.
4. Confirmar si la aceptacion electronica del asociado y el PDF devuelto con firma del pagador son el procedimiento aceptado. El DOCX por si solo no confirma ese procedimiento.
5. Obtener aprobacion de contenido de FONASIN. El PDF posterior fue generado y revisado visualmente con datos ficticios en una pagina A4; la descarga privada y los permisos estan cubiertos por las pruebas de backend.

## Limites de implementacion

- La aprobacion definitiva de ahorro voluntario sigue exigiendo el PDF devuelto y confirmado por administracion; no se convierte una revision favorable en aprobacion final.
- No cambiar autenticacion, activar asociados antiguos en masa, importar solicitudes historicas ficticias, modificar datos reales ni publicar en produccion a partir de esta conversacion.
- Las precisiones se consideran reglas de trabajo transmitidas por Carlos, no acta de aceptacion del cliente.
