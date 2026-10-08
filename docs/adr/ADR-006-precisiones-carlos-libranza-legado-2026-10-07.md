# ADR-006 — Precisiones transmitidas por Carlos sobre libranza y asociados antiguos

Fecha: 7 de octubre de 2026. Estado: **parcial, pendiente de confirmacion documental de FONASIN**. Fuente: conversacion de WhatsApp aportada por Diego y foto de un formato fisico de FONASIN. No sustituye el escaneo oficial ni la aceptacion de Bibian.

## Definiciones transmitidas

1. Carlos informa que ningun credito requiere firma empresarial. La libranza de descuento por nomina se usa para afiliacion nueva (aporte obligatorio) y para un asociado ya afiliado que solicita iniciar ahorro voluntario. La cartera de creditos existente no debe adquirir una exigencia de libranza por esta precision. No se construye una solicitud de credito nueva.
2. FONASIN no tiene historial anterior de **solicitudes** de ahorro voluntario, segun Carlos. No se fabrican solicitudes ni firmas en seeds o migraciones. Esto no elimina saldos o movimientos de ahorro que FONASIN aporte mediante sus archivos de importacion. Antes del despliegue se debe verificar, con consulta de solo lectura, si la base destino contiene solicitudes creadas durante pruebas o versiones anteriores.
3. Los asociados antiguos tienen expedientes fisicos. Carlos informa que FONASIN no validara esos documentos para habilitar el portal y que revisara/aprobara la actualizacion de datos posterior al primer ingreso. `profile_completion` ya permite completar el perfil sin nueva afiliacion ni libranza. **No se elimina todavia el control de cédula para activar altas manuales/importadas:** antes debe quedar aprobado como se verifica la identidad y el correo de destino para conceder el primer acceso. El codigo y la matriz de requisitos siguen reflejando el control vigente.

## Formato de libranza: inventario para cotejo

La foto fisica permite identificar encabezado, ciudad/fecha, destinatario de nomina, identidad y empleador, salario mensual, aporte obligatorio de 1,5 %, ahorro voluntario de valor fijo, total mensual, periodicidad, mes de inicio, autorizaciones y espacios de firma del solicitante y del pagador. **No permite verificar version, texto completo ni vigencia.**

Los PDF actuales son dos vistas separadas: `backend/resources/views/pdf/affiliation/payroll-authorization.blade.php` y `backend/resources/views/pdf/contributions/voluntary-savings-payroll-authorization.blade.php`. El caso de uso de ahorro voluntario ya entrega nombre, documento, lugar de expedicion, empleador, telefono, correo, salario, valor mensual, fecha y referencia al renderer. Las pruebas fijan ese contrato de datos, no aprueban el texto legal ni el diseno. Al recibir el formato digital se debe:

1. Registrar archivo de origen, version, fecha y aprobacion de FONASIN fuera del repositorio si contiene datos personales o firmas reales.
2. Cotejar literalmente las dos vistas contra el documento aprobado y documentar diferencias antes de cambiar la redaccion.
3. Definir para la solicitud **posterior** de ahorro voluntario si se autoriza solo el monto adicional o si el documento debe repetir el aporte obligatorio vigente y mostrar un total combinado. La foto tiene ambas filas, pero no resuelve el caso de un asociado que ya aporta.
4. Confirmar si la aceptacion electronica del asociado y el PDF devuelto con firma del pagador son el procedimiento aceptado. El codigo no supone que una foto equivalga a esa confirmacion.
5. Ajustar vistas y pruebas de generacion/descarga privada; verificar visualmente un PDF ficticio, sin datos reales, y obtener aprobacion de contenido de FONASIN.

## Limites de implementacion

- La aprobacion definitiva de ahorro voluntario sigue exigiendo el PDF devuelto y confirmado por administracion; no se convierte una revision favorable en aprobacion final.
- No cambiar autenticacion, activar asociados antiguos en masa, importar solicitudes historicas ficticias, modificar datos reales ni publicar en produccion a partir de esta conversacion.
- Las precisiones se consideran reglas de trabajo transmitidas por Carlos, no acta de aceptacion del cliente.
