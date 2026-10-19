# Seguridad y privacidad

## Alcance

Este documento define controles minimos de implementacion. No sustituye la aprobacion juridica de textos, finalidades, retencion ni anexos de tratamiento de datos.

## Identidad y autorizacion

- Todo acceso al portal requiere sesion autenticada.
- Toda peticion web comprueba tambien que la cuenta autenticada siga activa.
  Si fue desactivada, se cierra la sesion existente, se invalida el recuerdo de
  acceso y se renueva CSRF antes de denegar con 403. El evento `logout` registra
  solo `reason=inactive_session`; no se limita el control a nuevos ingresos.
- Los roles iniciales son `admin`, `reviewer` y `associate`.
- Cada accion privada debe pasar por una policy de Laravel; ocultar un boton no es autorizacion.
- Un asociado solo puede leer recursos relacionados con su propio `associate_id` resuelto en el servidor.
- Acciones administrativas sensibles requieren usuario identificado y registro de auditoria.
- El flujo publico de afiliacion protege las mutaciones de una solicitud mediante URLs temporales firmadas por Laravel y un token de borrador guardado de forma local solo durante la vigencia del borrador. El UUID de la solicitud por si solo no autoriza guardar secciones, documentos, consentimientos ni enviar. Al enviar la solicitud, el token tecnico se invalida y las rutas de borrador rechazan nuevas mutaciones porque el estado deja de ser `draft`.
- Las rutas publicas iniciales de afiliacion y FPQRS no usan sesion de usuario; por eso se excluyen de CSRF y deben mantener validacion estricta, rate limiting por IP/contexto, URLs firmadas cuando corresponde, storage privado y auditoria. Las rutas autenticadas usadas por el portal y el panel administrativo obtienen un token desde `/csrf-token` y lo envian en `X-CSRF-TOKEN`.
- La recuperacion local de borrador de afiliacion guarda solo el identificador, enlaces firmados temporales y el token tecnico del borrador por 24 horas. No se guardan datos personales, SARLAFT, documentos ni valores economicos en almacenamiento del frontend.
- El panel administrativo de afiliaciones requiere sesion y rol `admin` o `reviewer`. `reviewer` puede consultar, iniciar la revision y solicitar correcciones; solo `admin` puede aprobar, rechazar, cargar la libranza firmada externa y habilitar finalmente al asociado. Todas las acciones pasan por policies y los cambios se auditan.
- Los enlaces temporales de documentos generados desde portal o administracion incluyen contexto firmado y vuelven a validar sesion, contrasena actualizada, rol o propietario antes de entregar el archivo. Los enlaces publicos solo pueden servir documentos generados permitidos; los soportes cargados por el solicitante quedan restringidos al contexto administrativo.
- El modulo administrativo de asociados no elimina registros fisicamente. La accion de retiro cambia el estado a `inactive`, mantiene la trazabilidad, registra auditoria, desactiva el usuario vinculado e invalida sesiones y tokens de recuperacion vigentes. El alta manual crea o vincula un usuario con rol `associate` sin devolver contrasenas por API; el primer acceso debe resolverse mediante recuperacion/activacion por correo y documento.
- Un asociado `inactive` no puede iniciar sesion operativa, consultar creditos, documentos de afiliacion, crear borradores de actualizacion ni solicitar recuperacion de contrasena aunque haya tenido credenciales previas.
- La habilitacion desde una solicitud de afiliacion rechaza conflictos entre correo, documento, usuario y asociado. No se reasignan relaciones existentes de forma silenciosa.
- La creacion del borrador de actualizacion del asociado se ejecuta en transaccion, bloquea la fila del asociado mientras busca o crea el borrador activo y se respalda en MariaDB con una columna generada e indice unico para impedir mas de un borrador `draft` por asociado.
- La administracion manual de creditos requiere sesion, policy, auditoria y paginacion en listados administrativos. `reviewer` tiene acceso de consulta y solo `admin` puede crear, editar o archivar creditos. Solo permite asociados activos y lineas de credito aprobadas. El retiro operativo se maneja como estado `archived`, no como borrado fisico; los cambios de estado usan transiciones permitidas.
- La consulta de aportes del portal resuelve siempre el asociado desde la sesion. No acepta `associate_id` del navegador y diferencia modulo deshabilitado, asociado sin datos y datos disponibles.
- El historial de importaciones no expone `storage_key` ni `file_hash`. La carga masiva queda reservada a `admin`; `reviewer` puede consultar historial, pero no importar salvo aprobacion expresa.
- La importacion XLSX de asociados solo prepara cuentas con nombre completo, cedula y correo; no intenta dividir nombres ni envia mensajes masivos. Cada correo de activacion requiere una accion individual del administrador, tiene limite de frecuencia, token temporal hasheado y auditoria sin correo o documento en claro.
- Las cargas XLSX de cartera, aportes y ahorros validan extension, MIME, tamano, columnas obligatorias, tipos, valores, coincidencia de documento y nombre, duplicados dentro del archivo y repeticion por hash de archivo. El numero de pagare se cifra y se identifica mediante HMAC. El archivo queda en storage privado bajo una clave generada por servidor, no en `public/`.
- Las cuentas creadas con clave inicial interna quedan marcadas con `must_change_password` y no pueden usar rutas privadas de portal o administracion hasta cambiarla. El cambio exige la contrasena actual, guarda solo hash y registra evento de autenticacion.
- La recuperacion de contrasena usa correo y numero de documento. Para asociados se valida contra `associates`; para usuarios internos se valida contra el documento cifrado/hasheado en `users`. Los tokens se guardan hasheados, expiran y los eventos se registran sin exponer correo ni documento en claro.
- Un asociado cargado desde XLSX que todavia no tiene formulario habilitado recibe `requires_profile_completion`. Despues de definir su contrasena, el portal abre `/portal-asociado/completar-perfil`, crea o reutiliza un borrador `profile_completion`, precarga la identidad cifrada y bloquea cargas documentales y libranzas. Las rutas privadas verifican sesion, rol de asociado y cambio obligatorio de contrasena antes de renderizar el formulario; este flujo usa una clave de sesion separada y nunca crea una afiliacion publica como alternativa.
- Los enlaces relativos de documentos se resuelven contra `VITE_BACKEND_BASE_URL`. CORS permite el token temporal de borrador y las cabeceras de rango necesarias para previsualizar PDF desde el frontend autorizado.

## Correcciones de recuperacion y exportacion del 15-16 de octubre de 2026

- Recuperacion: el vencimiento se compara con una fecha absoluta, segun
  auth.passwords.users.expire (60 minutos). En el instante del vencimiento el
  token ya no vale; tambien se rechaza una fecha de creacion futura. La fila
  del token se bloquea en transaccion antes de consumirla para un solo uso.
- Se revocan las sesiones de la cuenta y se rota remember_token en la misma
  operacion de recuperacion. Produccion utiliza SESSION_DRIVER=database;
  la tabla/conexion de sesiones debe corresponder a su configuracion Laravel.
  El navegador que recupera su propia cuenta tambien pierde esa sesion y
  renueva CSRF. Una sesion de otra cuenta no se cierra por recuperar esta.
- Las sesiones se vinculan a la contrasena desde el login mediante el HMAC
  del guard Laravel. AuthenticateSession vuelve a comprobarlo en web, incluso
  si una peticion en vuelo hubiera reescrito una sesion despues de revocarla.
  No se persiste la contrasena ni su hash bcrypt sin proteger en la sesion.
- POST /password/reset limita a 5 peticiones/minuto por cuenta y 10 por IP,
  independientemente. Rotar uno no reinicia el otro. Las claves del limitador
  usan HMAC; el control cubre tambien solicitudes con datos invalidos y devuelve
  429 con Retry-After. El endpoint forgot conserva su limite separado.
- La exportacion administrativa de fichas usa el modo de texto literal del
  generador XLSX en valores, nombres de campos y categorias. No interpreta
  etiquetas de formula, enlaces, comentarios ni estilos aportadas en datos.
  Conserva los numeros, booleanos y proteccion previa de prefijos de formula.

Las regresiones estan en PasswordRecoverySecurityTest,
AssociateProfileSpreadsheetSecurityTest y AssociateProfileAdminHttpTest.
El navegador del otrosi agrega recuperacion valida/vencida y revocacion de
dos sesiones independientes, con control de otra cuenta y nuevo ingreso.
Estas verificaciones no sustituyen la revision de cookies, TLS y permisos del
entorno productivo ni son una certificacion general de seguridad.

## Dependencias: cierre local del 15 de octubre de 2026

`symfony/http-foundation` y `symfony/yaml` quedan en 7.4.21 y
`source-map-js` en 1.2.2 mediante actualizaciones acotadas del lockfile.
El gate PHP consulta tambien dependencias de desarrollo, sin excepciones
para las alertas corregidas.

Las siete entradas transitivas de Tailwind 3 se eliminan mediante una
migracion deliberada a Tailwind 4.3.3 y su plugin Vite. La auditoria completa
de npm, incluidas herramientas de desarrollo, queda sin vulnerabilidades
reportadas. No se usan excepciones, overrides incompatibles ni audit fix
--force. CI bloquea desde severidad low y dos regresiones impiden excluir
las dependencias de desarrollo de npm/Composer. Ver ADR-008 y la evidencia
local: la compatibilidad visual se verifica separadamente del build.
Mantener igualmente el servidor de desarrollo en loopback y no procesar
configuraciones ni fuentes no confiables. Cero avisos conocidos no es una
certificacion de seguridad total.

## Datos sensibles

- Contraseñas: exclusivamente hashes administrados por Laravel.
- Numeros de documento: version cifrada para consulta controlada y hash unico HMAC-SHA256 para busqueda. El HMAC usa `DATA_HASH_PEPPER`, secreto por entorno que no se versiona.
- Correos, IP y agentes de usuario usados para correlacion tecnica se guardan como HMAC-SHA256 cuando se persisten en auditoria o tablas operativas.
- Los usuarios internos pueden tener documento cifrado y hash de busqueda para soportar recuperacion de acceso sin depender de un perfil de asociado.
- Datos de afiliacion, financieros y SARLAFT: cifrados antes de persistirse y nunca enviados a logs.
- Los seeds, pruebas, capturas y entornos locales usan datos ficticios.
- Los mensajes de error no revelan detalles de autorizacion, estructura de base de datos ni secretos.

## Documentos

La libranza empresarial de afiliacion se recibe exclusivamente como PDF hasta
5 MB. El selector, Form Request y caso de uso mantienen el mismo contrato;
una imagen con extension PDF no obtiene autorizacion por su nombre.

1. Permitir solo tipos, firma real y tamano previamente aprobados.
2. Generar el nombre y `storage_key` en servidor.
3. Guardar archivos fuera del document root y fuera de Git.
4. Descargar o visualizar solo mediante una ruta autorizada y temporal; los enlaces de documentos se emiten con vigencia corta.
5. Auditar carga, cambio de estado y descarga.
6. No incluir archivos ni su contenido en backups de desarrollo, pruebas o ejemplos sin autorizacion.
7. La libranza firmada por entidad externa se registra como documento privado de afiliacion y reemplaza versiones previas del mismo tipo mediante archivado logico.

## FPQRS

- El modulo FPQRS registra la recepcion inicial, adjunto opcional privado y estado interno de entrega por correo institucional.
- Por aclaracion expresa de FONASIN, el correo institucional incluye el mensaje y el adjunto opcional PDF/JPG/PNG (maximo 5MB); la copia original permanece en storage privado. No se publica una URL del archivo ni se permite otro destinatario desde el formulario.
- El adaptador lee el archivo privado completo con limite de tamano y comprueba su longitud antes del envio. Utiliza un nombre MIME generado (`adjunto-fpqrs.pdf/jpg/png`), no el nombre proporcionado por el usuario ni la ruta privada.
- Archivo ausente, lectura incompleta, fallo de transporte o envio suprimido registran `delivery.failed`, no `delivery.sent`. HTTP responde 502 con un mensaje controlado; la pantalla no confirma el envio y conserva los campos. La solicitud registrada no debe reenviarse automaticamente: se indica contactar a FONASIN para evitar duplicados.
- `sent` significa aceptacion por el transporte de correo, no confirma recepcion en la bandeja del destinatario. La comprobacion de SMTP y recepcion real sigue siendo parte de la validacion del entorno productivo.
- En produccion FPQRS rechaza `log` y `array`, tambien dentro de cadenas `failover`/`roundrobin`, para no registrar exito sin entrega ni copiar adjuntos en logs. Resuelve la configuracion efectiva con el parser de Laravel, incluidos `MAIL_URL` y sus parametros, antes de autorizar cada transporte. Los transportes en memoria se permiten en pruebas; no se cambia la configuracion de otros correos.
- El frontend envia FPQRS al endpoint Laravel `POST /fpqrs-submissions` y conserva la validacion de archivo permitida por servidor.
- No genera radicado ni seguimiento publico.
- La auditoria no almacena correo, mensaje completo ni contenido del adjunto.
- El endpoint publico aplica rate limiting por IP y correo. La politica formal de retencion de nombre, correo, mensaje y adjuntos queda pendiente de aprobacion juridica.

## Secretos y configuracion

- `.env` no se versiona.
- No colocar claves, contrasenas, tokens, rutas privadas ni correos de produccion en Markdown, codigo o issues.
- Cada entorno usa una clave de aplicacion, credenciales MariaDB y storage propios.
- Cambiar un secreto requiere invalidar el anterior y actualizar el entorno correspondiente, nunca editarlo en Git.
- Laravel agrega cabeceras defensivas `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options` en respuestas web. La politica CSP se activa por entorno con `SECURITY_CSP_ENABLED=true` y `SECURITY_CSP_POLICY`.
- El frontend estatico servido por Apache/cPanel requiere una CSP equivalente configurada en el virtual host, `.htaccess` aprobado o panel del proveedor, porque esos archivos no pasan por el middleware de Laravel.
- Produccion debe configurar `DATA_HASH_PEPPER` antes de ejecutar migraciones. Cambiarlo despues requiere un plan de remigracion de hashes; no debe rotarse como una contrasena normal sin coordinar el recalculo de datos existentes.

## Lista de revision de seguridad

### Reauditoria de formularios privados (19 de octubre de 2026)

Los borradores `profile_completion` y `data_update` requieren sesion activa,
contrasena ya actualizada y asociado titular activo en lectura, guardado,
consentimientos y envio. Enlace firmado y token no sustituyen la sesion.
La misma titularidad se exige en vista/descarga del resumen privado, incluso
si un enlace emitido anteriormente no incluye `context=portal`. Los permisos
administrativos y la afiliacion inicial publica conservan sus flujos separados.

Los nuevos importes de formulario usan decimal canonico (punto decimal, sin
agrupadores, maximo dos decimales); no se eliminan letras o simbolos para
convertirlos silenciosamente. Tambien se comprueban los campos monetarios en
guardados parciales. Los limites aprobados no cambian. El XLSX mantiene numeros
para importes validos e identificadores como texto; los valores historicos no
canonicos se conservan como texto literal protegido, sin convertir formulas ni
reescribir registros o documentos emitidos. Esta politica no cambia el parser
localizado independiente de las importaciones XLSX.

La segunda reauditoria exige cadenas para decimales monetarios en escrituras de
formulario, conservando enteros JSON exactos y rechazando floats. No se confia en
la conversion `(string)` de un float para validar precision. Los consumidores
internos del decimal compartido verifican igualdad exacta tras representar dos
decimales, sin depender de la precision de impresion configurada en PHP.
El envio revalida todas las secciones persistidas dentro de la transaccion y
antes de emitir documentos: un borrador heredado marcado completo no elude las
reglas actuales. Un rechazo no reescribe el dato historico ni consume el token.

- [ ] La ruta tiene autenticacion y policy cuando corresponde.
- [ ] La validacion ocurre en servidor.
- [ ] Los datos sensibles no aparecen en logs ni auditoria.
- [ ] El archivo no es publicamente accesible.
- [ ] La accion sensible genera evento de auditoria.
- [ ] Pruebas cubren acceso autorizado y no autorizado.
