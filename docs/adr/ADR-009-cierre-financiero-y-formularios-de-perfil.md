# ADR-009 - Limites financieros y separacion de formularios de perfil

Fecha: 19 de octubre de 2026. Estado: implementacion local, sujeta a pruebas y aceptacion funcional. Fuente: reporte de revision con FONASIN aportado por Diego, quien autorizo implementar los pendientes. No equivale a entrega ni aceptacion productiva.

## Decisiones

- Componentes economicos conservan el maximo de COP 10.000.000.000. Solo total de ingresos mensuales y total de egresos mensuales admiten COP 20.000.000.000. Se calcula y valida la igualdad con sus componentes; no se ensancha el limite de otros campos ni se altera el esquema de base de datos.
- Las tasas se presentan con coma decimal y sin ceros finales innecesarios. Se conservan sus decimales significativos y la unidad informada: no convertir tasas ni atribuir unidad mensual a registros historicos sin esa base.
- La ficha XLSX traduce los campos conocidos al espanol. Solo los campos monetarios conocidos se convierten a numeros de Excel dentro de la precision admitida. Documento, telefono, pagare y referencias permanecen texto; se mantiene el bloqueo de formulas, etiquetas interpretables e hipervinculos. Campos de extensiones desconocidas conservan su clave literal, sin interpretarla.
- `profile_completion` y `data_update` no capturan instrucciones de ahorro voluntario. El servidor descarta esos dos campos en guardado completo/parcial; no los copia al abrir un nuevo borrador y limpia borradores pendientes reanudados. Nuevos resumenes de perfil y su PDF no los muestran. No se modifican afiliaciones de origen ni archivos historicos emitidos.
- La afiliacion inicial mantiene su opcion de ahorro. El modulo de ahorro voluntario independiente conserva autorizacion, libranza e historial propios; solo se usa despues de habilitar el perfil. Completar/actualizar el perfil no crea solicitudes de ahorro ni libranzas nuevas.
- El correo institucional siempre queda visible y seleccionable; el boton lo copia con confirmacion solo tras resolver Clipboard API. Si el navegador deniega/no ofrece el permiso, queda disponible la copia manual, sin abrir `mailto` ni otra ventana.

## Verificacion y limites

Las regresiones cubren bordes y desbordes, totales inconsistentes, ambos propositos de perfil, payloads inyectados, conservacion de origen/documentos, PDF generado, unidades de tasas y sus dos columnas administrativas, contenido/tipos del XLSX y acceso por rol, y exito/fallo/ausencia de portapapeles. Los recorridos de navegador ejercitan ambos formularios de perfil con totales maximos, ademas de la afiliacion inicial y el modulo independiente.

No se implementan cambios visuales indeterminados de ciudades o convenios. Recepcion SMTP real de FPQRS, revision visual y aceptacion de FONASIN requieren validacion del entorno final. No se ejecutan migraciones ni pruebas contra produccion.

## Evidencia local del cierre

- Suite backend completa: MariaDB, 421 pruebas aprobadas y 2340 aserciones, sin saltos; SQLite, 395 aprobadas y 26 saltadas (2267 aserciones). Los saltos de SQLite no sustituyen la corrida de MariaDB.
- Frontend: 116 pruebas aprobadas en 20 archivos. Compilacion TypeScript/Vite correcta; permanece el aviso de tamano de algunos chunks.
- Chrome contra Laravel/Vite y MariaDB locales: cinco recorridos completos aprobados sin saltos, incluidos ambos formularios de perfil; dos comprobaciones adicionales del tema en escritorio y movil aprobadas.
- `npm audit --audit-level=low` y `composer audit --no-interaction`: sin avisos de vulnerabilidades conocidas reportados en esta consulta. No equivale a ausencia absoluta de vulnerabilidades.
- La primera corrida de navegador fallo porque una asercion aun esperaba tasas con cuatro decimales. Se actualizo a la presentacion aprobada y se repitieron los cinco recorridos con fixtures nuevos: cinco aprobados. No se cuenta aquella corrida como verde.
- FPQRS ya corregido en la base: la suite completa conserva sus regresiones de adjuntos PDF/PNG/JPEG, sin archivo y fallos de lectura/almacenamiento/envio. Esta evidencia es local; no acredita recepcion SMTP real, CI remoto ni produccion.

No se publicaron estos cambios ni se modificaron `main`, cPanel o datos reales durante esta validacion.

## Reauditoria posterior: dos brechas concretas

La revision posterior encontro dos casos no cubiertos por aquella bateria: un
borrador privado admitia enlace/token sin sesion, y el parser monetario eliminaba
caracteres pero guardaba el valor original, que podia terminar como texto en XLSX.
El verde anterior no acredita esos casos. Se agregaron regresiones que fallaron
antes de aplicar las correcciones.

- Se exige titular activo en ambos propositos privados y ambos estados editables,
  para leer, guardar, consentir y enviar. El resumen emitido exige titularidad en
  preview/descarga, tambien en enlaces firmados sin contexto explicito. Los enlaces
  de afiliacion inicial siguen siendo publicos y los administrativos conservan policy.
- Un decimal canonico compartido admite numeros sin separadores de miles, hasta
  dos decimales, y elimina solo ceros no significativos. No acepta formulas, texto,
  notacion cientifica textual, booleanos, arrays, no finitos ni exceso de precision.
  Los campos monetarios conocidos se normalizan antes de cifrar, incluso en
  guardado parcial; se mantienen los maximos del formulario. No se modifica el
  parser localizado de importaciones ni se migran datos historicos.
- La pantalla edita coma decimal y miles agrupados, envia punto decimal y calcula
  totales mediante centavos enteros. Resumen/libranza y XLSX conservan centavos.
  Un valor historico no canonico se conserva como texto protegido en XLSX, no se
  convierte silenciosamente ni se ejecuta como formula.
- Los envios privados registran el usuario autenticado como actor, no un actor
  de sistema. La auditoria no contiene importes ni payloads sensibles.

La comprobacion de esta correccion debe distinguir las nuevas regresiones del
resultado anterior; ninguna evidencia local acredita SMTP real o produccion.

### Evidencia de la correccion posterior

- Antes de corregir: los nuevos casos reprodujeron respuestas 200 donde debian
  existir 403/422 y persistencia/exportacion no canonica. No se uso ese resultado
  como aprobacion. Las pruebas antiguas de envio privado se actualizaron para
  crear y autenticar un titular real, sin quitar sus verificaciones de negocio.
- Despues de corregir: backend completo en MariaDB, 490 aprobadas y 2737 aserciones,
  sin saltos; SQLite, 464 aprobadas y 26 saltadas, con 2664 aserciones.
- Frontend completo: 130 aprobadas en 20 archivos; TypeScript/Vite compilados.
  Persiste el aviso no bloqueante de chunks mayores de 500 kB.
- Chrome/Laravel/Vite/MariaDB locales: cinco recorridos completos aprobados y dos
  comprobaciones de tema responsive aprobadas. Ambos formularios privados guardan
  los totales maximos, calculan patrimonio con centavos y rechazan POST anonimo
  aun con firma/token validos; el titular obtiene su PDF y el anonimo recibe 403.
- Las pruebas HTTP cubren ambos propositos/estados editables y titular ajeno,
  cuenta/asociado inactivos, contrasena pendiente, token ausente/incorrecto y
  firma ausente. Tambien verifican los diez campos financieros, guardado parcial
  y completo, conservacion del dato previo ante 422, cifrado y celdas XLSX reales.
- Auditorias npm/Composer sin avisos de vulnerabilidades conocidas reportados en
  esta consulta; Pint y `git diff --check` correctos.

Este cierre se limita a las dos brechas reproducidas y sus regresiones locales.
No certifica ausencia universal de vulnerabilidades, recepcion SMTP real, CI
remoto ni aceptacion de FONASIN. No hubo migracion ni modificacion de datos reales.

## Segunda reauditoria: precision JSON y borradores heredados

Se reprodujeron dos casos adicionales en `964c45a`: un numero JSON grande con
precision excedente podia redondearse al convertir un float a texto, y el envio
solo comprobaba `completed_at` y consistencia salarial, sin revalidar el resto
del contenido guardado. La presencia de un borrador heredado invalido en pruebas
no demuestra que exista en produccion. Los nuevos casos fallaron antes del arreglo.

- En escrituras de formulario los decimales deben llegar como cadenas, como ya
  hace React. Se conservan enteros JSON exactos; se rechazan floats JSON, incluso
  `100.0`, para no depender de digitos que el parser pudo perder. Las pruebas
  usan cuerpos JSON literales, no solo numeros decodificados y recodificados.
- Para consumidores internos del decimal compartido (incluido XLSX), un float
  solo se acepta si representar dos decimales y reconvertirlo produce exactamente
  el mismo valor. No se cambia `precision`/`serialize_precision` global ni se
  autoriza redondeo silencioso. Hay pruebas con ambas configuraciones alteradas.
- El envio bloquea el registro y las secciones, descifra y revalida las cinco
  secciones con el proposito correspondiente antes de generar documentos. Tambien
  verifica los totales y la consistencia salarial. No confia en `completed_at`
  como sustituto de la validacion de contenido.
- Ante un dato invalido devuelve 422, conserva estado, token, contenido cifrado,
  documentos y correccion pendiente; no genera documentos ni confirma un evento
  de envio. Corregir la seccion por el flujo normal permite enviar la misma
  solicitud. No hay migracion ni reparacion silenciosa de datos historicos.
- Las regresiones de borradores cubren afiliacion inicial, completar perfil y
  actualizar datos, tanto en borrador como en correccion. Incluyen errores en cada
  seccion y un total incoherente, ademas de su posterior correccion y envio real.

### Resultado local de la segunda correccion

- La medicion previa al arreglo encontro 42 fallos y 29 pruebas aprobadas en el
  subconjunto nuevo/inicial: los casos originales no estaban cubiertos por el
  verde previo. Se ampliaron despues los cuerpos JSON literales y sus controles.
- Suite completa final SQLite: 512 aprobadas, 26 saltadas, 3210 aserciones.
- Suite completa final MariaDB: 538 aprobadas, sin saltos, 3283 aserciones.
  Una primera corrida se descarto por errores PDO durante el arranque de MariaDB;
  se verificaron disponibilidad y conexion antes de repetir toda la suite, sin
  cambios de codigo entre ambas corridas.
- Frontend: 130 pruebas aprobadas, compilacion TypeScript/Vite correcta; sigue
  el aviso de tamano de chunks. npm/Composer no reportaron vulnerabilidades
  conocidas en la consulta ejecutada. Pint y `git diff --check` correctos.
- Navegador: cinco recorridos completos aprobados y dos comprobaciones de tema
  responsive aprobadas. El primer intento del tema de escritorio tuvo timeout
  al cargar Vite; se repitio la bateria sin cambiar aserciones ni tiempos. Los
  recorridos funcionales aun no habian empezado en aquel intento.

La evidencia corresponde a desarrollo local con datos sinteticos; no acredita
CI remoto, SMTP real ni produccion. No se ejecutaron migraciones de produccion,
no se modificaron datos reales ni se publicaron estos cambios.
