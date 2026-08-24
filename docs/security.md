# Seguridad y privacidad

## Alcance

Este documento define controles minimos de implementacion. No sustituye la aprobacion juridica de textos, finalidades, retencion ni anexos de tratamiento de datos.

## Identidad y autorizacion

- Todo acceso al portal requiere sesion autenticada.
- Los roles iniciales son `admin`, `reviewer` y `associate`.
- Cada accion privada debe pasar por una policy de Laravel; ocultar un boton no es autorizacion.
- Un asociado solo puede leer recursos relacionados con su propio `associate_id` resuelto en el servidor.
- Acciones administrativas sensibles requieren usuario identificado y registro de auditoria.
- El flujo publico de afiliacion protege las mutaciones de una solicitud mediante URLs temporales firmadas por Laravel. El UUID de la solicitud por si solo no autoriza guardar secciones, documentos, consentimientos ni enviar.
- Las rutas publicas iniciales de afiliacion y FPQRS no usan sesion de usuario; por eso se excluyen de CSRF y deben mantener validacion estricta, URLs firmadas cuando corresponde, storage privado y auditoria. Las rutas autenticadas usadas por el portal y el panel administrativo obtienen un token desde `/csrf-token` y lo envian en `X-CSRF-TOKEN`.
- La recuperacion local de borrador de afiliacion guarda solo el identificador y enlaces firmados temporales por 24 horas. No se guardan datos personales, SARLAFT, documentos ni valores economicos en `localStorage`.
- El panel administrativo de afiliaciones requiere sesion y rol `admin` o `reviewer`. La revision del formulario, la carga de libranza firmada externa y la habilitacion final del asociado pasan por policies y casos de uso auditados.
- El modulo administrativo de asociados no elimina registros fisicamente. La accion de retiro cambia el estado a `inactive`, mantiene la trazabilidad y registra auditoria.

## Datos sensibles

- Contraseñas: exclusivamente hashes administrados por Laravel.
- Numeros de documento: version cifrada para consulta controlada y hash unico para busqueda.
- Datos de afiliacion, financieros y SARLAFT: cifrados antes de persistirse y nunca enviados a logs.
- Los seeds, pruebas, capturas y entornos locales usan datos ficticios.
- Los mensajes de error no revelan detalles de autorizacion, estructura de base de datos ni secretos.

## Documentos

1. Permitir solo tipos, firma real y tamano previamente aprobados.
2. Generar el nombre y `storage_key` en servidor.
3. Guardar archivos fuera del document root y fuera de Git.
4. Descargar o visualizar solo mediante una ruta autorizada y temporal.
5. Auditar carga, cambio de estado y descarga.
6. No incluir archivos ni su contenido en backups de desarrollo, pruebas o ejemplos sin autorizacion.
7. La libranza firmada por entidad externa se registra como documento privado de afiliacion y reemplaza versiones previas del mismo tipo mediante archivado logico.

## FPQRS

- El modulo FPQRS registra la recepcion inicial, adjunto opcional privado y estado interno de entrega por correo institucional.
- El correo institucional contiene el mensaje recibido y metadatos minimos; los adjuntos quedan en storage privado y no se adjuntan al correo.
- No genera radicado ni seguimiento publico.
- La auditoria no almacena correo, mensaje completo ni contenido del adjunto.

## Secretos y configuracion

- `.env` no se versiona.
- No colocar claves, contrasenas, tokens, rutas privadas ni correos de produccion en Markdown, codigo o issues.
- Cada entorno usa una clave de aplicacion, credenciales PostgreSQL y storage propios.
- Cambiar un secreto requiere invalidar el anterior y actualizar el entorno correspondiente, nunca editarlo en Git.

## Lista de revision de seguridad

- [ ] La ruta tiene autenticacion y policy cuando corresponde.
- [ ] La validacion ocurre en servidor.
- [ ] Los datos sensibles no aparecen en logs ni auditoria.
- [ ] El archivo no es publicamente accesible.
- [ ] La accion sensible genera evento de auditoria.
- [ ] Pruebas cubren acceso autorizado y no autorizado.
