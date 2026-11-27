# Ajustes administrativos de asociados

Base: develop d848f37. Cambios preparados a solicitud de Carlos el 26 de
noviembre de 2026; pendientes de aceptacion funcional y despliegue por Diego.

## Comportamiento

- El listado muestra el total real y permite Anterior/Siguiente en paginas de
  50. El servidor ordena por fecha e ID para evitar saltos entre registros con
  igual fecha. Los selectores de otros modulos recuperan tambien las paginas
  posteriores, sin reutilizar como coleccion completa una pagina del listado.
- La tabla incluye barras horizontales sincronizadas arriba y abajo.
- Editar correo solicita nuevo correo y confirmacion. Abrir o cancelar no
  modifica datos. Guardar deja usuario y asociado inactivos; revoca contrasena,
  sesiones, recuerdo y enlaces anteriores; exige establecer otra contrasena.
  El administrador activa y envia el nuevo acceso con las acciones existentes.
  No hay envio automatico al guardar.
- Un correo ocupado, invalido, sin confirmacion o editado desde una pantalla
  desactualizada no modifica el registro. No se corrigen cuentas con roles de
  administrador/revisor desde esta opcion. Se conservan ID e historiales.
- Cargar cedula tambien esta disponible para registros anteriores activos o
  exentos que no tienen soporte. Admite PDF/JPG/PNG hasta 5 MB, conserva acceso
  privado, permisos y auditoria. No desactiva ni valida automaticamente al
  asociado y no permite reemplazar un archivo ya registrado.
- Nombre y numero de documento quedan fuera de esta edicion.

## Verificacion local

- Suite backend completa del ajuste administrativo bf44b8a, anterior al cambio
  posterior de vigencia: 591 pruebas, 3806 aserciones, todas correctas en
  MariaDB local sobre fonasin_test. Duracion: 9 minutos 53 segundos.
- 30 pruebas dirigidas backend, 243 aserciones: AssociateCorrectionsHttpTest,
  AssociateAdminHttpTest y AssociateImportOnboardingHttpTest, en MariaDB local,
  base aislada fonasin_test. Incluyen permisos, rollback por fallo de auditoria,
  duplicados, reenvio de acceso y registros posteriores al numero 50.
- Frontend completo: 166 pruebas, 23 archivos.
- Compilacion TypeScript/Vite correcta. Se mantiene el aviso de tamano de bundles.
- Recorrido visual en Edge con API simulada y 51 registros sinteticos: pagina 2,
  barras sincronizadas, cambio de correo, estado inactivo y envio bloqueado hasta
  activacion; regreso a pagina 1, sin errores JavaScript. No equivale a prueba
  de entrega real de correo. Script y captura locales excluidos de Git.

La preparacion inicial de las pruebas backend requirio usar las credenciales
locales existentes y el controlador `mariadb`; el usuario root y el controlador
`mysql` no corresponden a este entorno. Las pruebas dirigidas anteriores son la
corrida correcta posterior, no las tentativas de configuracion fallidas.

## Ampliacion temporal de enlaces a 24 horas

Solicitud posterior de Carlos por la jornada de atencion de FONASIN: ampliar
la configuracion comun `auth.passwords.users.expire` a 1440 minutos. Afecta
primer acceso y recuperacion, incluidos tokens existentes no consumidos ni
revocados; no modifica la sesion ni el tiempo para completar formularios.
Correos y auditoria de activacion usan la misma configuracion del validador.
Los correos nuevos indican 24 horas. Se mantienen uso unico y revocacion por
reenvio, correccion o desactivacion. No hay migracion ni cambio de frontend.

Validacion posterior: 50 pruebas, 324 aserciones correctas en MariaDB local
fonasin_test (PasswordRecoverySecurityTest, AuthenticationHttpTest,
AssociateCorrectionsHttpTest y AssociateImportOnboardingHttpTest). Incluyen
validez tras una y doce horas, limite exacto de 24 horas, uso unico, reenvio,
texto de ambos correos y retorno de la configuracion a una hora. No se repitio
la suite completa ni frontend para este cambio limitado a vigencia y correo.

Despliegue: publicar tambien las vistas de correo y regenerar la cache de
configuracion de Laravel (`php artisan config:cache`) desde el directorio real
del backend productivo. Si hay procesos persistentes de correo, reiniciarlos
mediante el procedimiento de despliegue existente. No se modifica produccion
desde esta revision local. Para volver a una hora, coordinar la transicion de
los pendientes segun la nota de auditoria; no cambiar la fecha de los tokens.

## Consulta por cedula y filtro del listado

Solicitud posterior de Carlos: Consultar ficha tambien filtra la tabla al
asociado encontrado, sin limitarse a los registros de la pagina visible.
Se reutiliza el POST autorizado de busqueda por cedula y despues se carga la
fila por UUID validado; no se coloca la cedula en la URL. Ver todos limpia el
filtro, la ficha y el campo de busqueda y carga la primera pagina. Las acciones
de activacion, cedula y correo se conservan sobre la fila filtrada. Las respuestas
desactualizadas de busquedas/listados se descartan. Si no hay coincidencia, la
tabla queda vacia con un mensaje de consulta sin resultados, en lugar de mostrar
los registros anteriores o afirmar que no existen asociados en el sistema.

No cambia configuracion ni esquema. Requiere desplegar backend y frontend del
mismo commit.

Validacion del filtro: 15 pruebas backend y 125 aserciones correctas en MariaDB
local fonasin_test (AssociateCorrectionsHttpTest y AssociateProfileAdminHttpTest);
63 pruebas frontend seleccionadas, compilacion y recorrido visual en Edge con
API simulada: consulta del registro 51 desde pagina 1, una sola fila y retorno
a los 50 de la primera pagina con Ver todos. Sin errores JavaScript. No se
repitieron las suites completas para este cambio acotado.

## PDF del formulario desde la ficha

Se incorpora Ver formulario PDF en Ficha > Formulario, solo cuando hay un
formulario habilitado en la ficha. La presentacion consulta la solicitud por
su ID existente, selecciona el PDF `affiliation_summary` uploaded de esa misma
solicitud y reutiliza el visor DocumentPreview. No crea PDF ni busca documentos
en otra solicitud. Si falta el PDF muestra un aviso y mantiene los datos.
Los intentos repetidos consultan enlaces nuevos con su vigencia documental
existente de diez minutos, contexto admin, firma relativa y autorizacion.
Cambiar de formulario reinicia el visor para evitar mostrar el documento anterior.

No se modifican rutas, autorizaciones, esquema, almacenamiento ni generacion de
documentos. La visualizacion sigue registrando el evento existente document.viewed.
Solo requiere la nueva compilacion frontend; se entrega en develop para despliegue
desde main mediante el procedimiento existente. Las evidencias locales se excluyen
de Git y utilizan exclusivamente cuentas ficticias.

Validacion: 174 pruebas frontend completas correctas (24 archivos) y compilacion.
Recorrido real en Edge contra frontend/backend locales y la base ficticia
fonasin_e2e: consulta de asociado con formulario habilitado, apertura del PDF
existente (respuesta 200, MIME application/pdf y cabecera de archivo %PDF-),
cierre del visor y acceso al mismo enlace firmado desde invitado denegado con
403. Sin errores JavaScript. No se regeneraron documentos ni se modificaron
cuentas o solicitudes. No se repitio la suite backend al no cambiar codigo de
servidor; el recorrido utiliza las rutas y autorizaciones reales existentes.

## Auditoria de dependencias y correccion del CI

La ejecucion remota 45871183837 del commit 343d47a paso MariaDB, frontend y
recorridos en navegador, pero fallo en composer audit antes de ejecutar SQLite.
Se reprodujeron 14 avisos sobre seis paquetes del lock existente. No implica
que las pruebas funcionales hayan fallado ni demuestra explotacion del sistema.

Actualizacion limitada con Composer --with-all-dependencies --minimal-changes:

| Paquete | Anterior | Corregido |
|---|---|---|
| laravel/framework | 12.69.3 | 12.74.0 |
| symfony/http-foundation | 7.4.21 | 7.4.24 |
| symfony/http-kernel | 7.4.16 | 7.4.24 |
| symfony/mailer | 7.4.15 | 7.4.24 |
| symfony/routing | 7.4.15 | 7.4.24 |
| symfony/yaml | 7.4.21 | 7.4.24 |

Se conservan restricciones de composer.json, versiones principales, auditorias
y workflow. No se agregan paquetes ni excepciones a avisos de seguridad.
Composer audit --locked no encuentra avisos tras actualizar; npm audit reporta
cero avisos. Composer validate reconoce el manifiesto valido y mantiene el aviso
preexistente por fijar exactamente laravel-dompdf 3.1.2; no se cambia esa politica
para silenciar una advertencia que no es la causa del fallo.

Referencias primarias consultadas:
[Laravel](https://github.com/laravel/framework/security/advisories/GHSA-63hm-g96r-2m2q),
[Symfony](https://github.com/symfony/symfony/security/advisories/GHSA-xg2q-4rrq-657q).
El informe completo de Composer se conserva solo como evidencia local.

Validacion con las versiones actualizadas: suite MariaDB completa, 598 pruebas
y 3839 aserciones correctas; suite SQLite completa, 598 casos (29 omitidos por
requerir MariaDB), 3718 aserciones y ningun fallo. composer audit instalado y
--locked terminan sin avisos. Recorrido real de la ficha y PDF privado local
correcto, con invitado denegado por 403 y sin errores JavaScript. No se cambia
frontend; su suite y build se ejecutan de nuevo en el CI remoto del nuevo commit.

Para desplegar esta correccion hay que instalar el composer.lock actualizado
mediante composer install del procedimiento existente; no ejecutar composer
update en produccion ni copiar solo el frontend. No requiere migraciones nuevas.

## Mostrar contrasena y aclarar errores de recuperacion

Solicitud de Carlos ante una captura con un error generico de cambio de clave.
La captura no permite diagnosticar el estado real del enlace o de la cuenta.
Se agrega PasswordField compartido con ojo independiente, inicialmente oculto,
en los dos campos de recuperacion y los tres de cambio obligatorio. El control
es accesible, no envia el formulario, conserva el valor y se deshabilita mientras
guarda. Los campos vuelven a ocultarse al limpiarse tras el exito.

La pantalla informa los requisitos existentes: 8 a 128 caracteres con letras y
numeros, y confirmacion coincidente. No se cambia la politica de contrasenas.
passwordRecoveryService distingue errores por las claves de validacion, tambien
con mensajes traducidos: password, password_confirmation y token. El fallo de
cuenta sigue siendo generico. Solo la pantalla que solicita recuperacion por
correo y cedula conserva la indicacion de revisar esos dos campos; la pantalla
que establece la nueva clave no pide un dato inexistente. No se imprimen ni
persisten claves, tokens o datos reales; no se modifica ninguna cuenta productiva.

Validacion: 182 pruebas frontend completas correctas (27 archivos), compilacion
y recorrido movil en Edge con respuestas de recuperacion simuladas. Se prueban
visibilidad independiente, ausencia de envio al pulsar el ojo, conservacion del
payload y traduccion de errores por campo; exito limpia y oculta. En la primera
corrida se precisaron dos selectores de campos en la prueba de cambio obligatorio,
porque tambien coincidían con las etiquetas accesibles de los nuevos botones;
la repeticion completa paso. No se cambian ni se relajan pruebas de autorizacion.
La evidencia de navegador usa solo claves, correo y token ficticios; no demuestra
la causa del error de la cuenta real ni envio de correo productivo. No se repite
backend local al no modificar servidor ni reglas; CI ejecuta sus controles.

## Revision funcional y publicacion

1. Comprobar total y navegacion con mas de 50 asociados, incluyendo el uso de
   barras y selectores administrativos.
2. Con una cuenta ficticia, abrir/cancelar edicion; luego corregir correo,
   comprobar estado inactivo, activar y enviar acceso al nuevo destinatario.
3. Agregar cedula a un registro anterior sin soporte, comprobar descarga privada
   y que estado, datos e historial se conservan.
4. Confirmar que revisor/asociado no tienen acciones de correccion ni carga.

No se requieren migraciones nuevas ni dependencias adicionales. El cambio
requiere backend y frontend del mismo commit. Diego revisa develop, integra en
main y realiza el despliegue con los respaldos habituales. No se modifica .env,
storage productivo ni datos reales desde este ajuste local. CI remoto y
aceptacion funcional no se presuponen a partir de estas pruebas.
