# Trazabilidad de requisitos Frontend

## Proposito

Esta matriz conecta la especificacion funcional con el codigo, las pruebas y la aceptacion de FONASIN. Es obligatoria para revisar avance: una pantalla visible no equivale por si sola a un requisito cumplido.

Fuente funcional: `02_GUIA_EQUIPO_FRONTEND_WEB_AFILIACION_PORTAL_V2.docx`, version 2.0 del 15 de agosto de 2026.

Ultima actualizacion: 19 de octubre de 2026, ajustes de sumatorias, tasas, ficha XLSX, ahorro separado de formularios de perfil y copia de correo (ADR-009). Las reglas funcionales base constan en ADR-005. Aun pendiente validacion visual y aceptacion final.

Reauditoria posterior del mismo dia: los formularios privados y sus nuevos PDF
exigen titular autenticado, ademas de enlace firmado/token donde corresponda.
El formulario distingue agrupadores de miles y coma decimal al editar; envia
decimal canonico y calcula sumatorias en centavos enteros. Los PDF y XLSX no
multiplican ni eliminan centavos. Ver regresiones de autorizacion y contrato
monetario y la seccion de reauditoria en ADR-009; no implica aceptacion productiva.

En la segunda reauditoria el servidor exige texto para decimales de formulario
(el payload actual de React ya cumple), y vuelve a validar el contenido guardado
al enviar. Un error de un borrador heredado debe corregirse en la seccion antes
de reenviar; no se debe presentar el rechazo como envio confirmado.

## Estados permitidos

| Estado | Significado |
|---|---|
| Pendiente | No existe una implementacion utilizable. |
| En curso | Existe implementacion parcial o contenido provisional. |
| Implementado | El comportamiento solicitado funciona y no aparenta funciones inexistentes. |
| Validado | Ademas de implementado, tiene evidencia de build, pruebas, responsive y accesibilidad aplicables. |
| Aceptado | FONASIN aprobo contenido y comportamiento; puede evaluarse para `main`. |
| Bloqueado | Falta un insumo, contrato Backend o decision externa identificada. |

Solo FONASIN puede mover contenido funcional a `Aceptado`. Una PR puede proponer `Implementado` o `Validado` y debe enlazar evidencia.

## Sitio publico

| ID | Requisito | Estado | Evidencia actual | Siguiente criterio de cierre |
|---|---|---|---|---|
| FE-WEB-001 | Estructura global | En curso | `src/components/layout`, `navbar`, `footer` | Validar teclado y responsive con pruebas reproducibles. |
| FE-WEB-002 | Inicio | En curso | Ruta `/` y `src/pages/Home` | Sustituir y aprobar todos los contenidos provisionales. |
| FE-WEB-003 | Institucional | En curso | Secciones About, History y centro documental con archivos oficiales | Aprobar los contenidos institucionales restantes y completar la validacion visual. |
| FE-WEB-004 | Productos y servicios | En curso | `/productos-y-servicios`, `/creditos`, ahorros y convenios; fichas turísticas de Caribbean Sol y Mar y Luz Marina Vargas | Aprobar nombres, textos, condiciones y beneficios restantes. |
| FE-WEB-005 | Transparencia | Implementado | Centro documental con estatutos, politica de datos, manual de lineas de credito, reglamento de cartera y estados financieros 2025 | Validar visualmente los documentos publicados con FONASIN. |
| FE-WEB-005A | Visor PDF | Implementado | Visor embebido y descarga disponible para cada documento institucional | Validar rendimiento del estado financiero escaneado en el hosting productivo. |
| FE-WEB-005B | Balance social | En curso | Ruta `/balance-social` consulta solo informes publicados desde `public_content_items`; panel permite PDF privado y borrador | FONASIN debe suministrar y aprobar el primer informe. |
| FE-WEB-006 | Noticias | En curso | Ruta `/noticias` consulta solo comunicados publicados desde Backend; panel permite redactar y retirar | FONASIN debe suministrar y aprobar las primeras publicaciones. |
| FE-WEB-007 | Contacto | En curso | Correo despliega la direccion institucional sin copiar; pulsar la direccion copia y confirma Correo copiado, manteniendola visible y seleccionable. Ante fallo/ausencia de portapapeles ofrece copia manual, sin mailto ni otra ventana. Botones accesibles con estado expandido. Redes administrables en panel con validacion de hosts HTTPS; redes vacias no se muestran. | FONASIN debe entregar enlaces oficiales. |
| FE-WEB-008 | FPQRS | Implementado | Formulario conectado a `POST /fpqrs-submissions`; PDF/JPG/PNG hasta 5MB incluido en el correo y conservado privadamente. Archivo rechazado bloquea el envio hasta reemplazarlo o retirarlo explicitamente. Confirmacion solo con identificador y `delivery_status=sent`; ante fallo de adjunto/transporte, HTTP 502 y alerta sin exito ni reenvio automatico. Una respuesta ilegible/desconocida no afirma registro ni envio. Pruebas locales de MIME/bytes, PDF/imagenes/sin archivo, fallos, MAIL_URL y pantalla. | Validar envio real con SMTP de produccion y aprobar politica de retencion. |
| FE-WEB-009 | WhatsApp | En curso | Enlace configurable con `VITE_WHATSAPP_URL` | Confirmar numero, mensaje y comportamiento oficial. |
| FE-WEB-010 | SEO y accesibilidad | En curso | HTML en español, description, semantica y foco parcial | Ejecutar auditoria sin errores criticos y agregar pruebas. |
| FE-WEB-011 | Transacciones y QR | Pendiente | Acceso marcado `Proximamente` | Publicar QR, destino, concepto, instrucciones, advertencia y descarga. |
| FE-WEB-012 | Analitica opcional | Pendiente | No integrada | Requiere aprobacion de finalidad, identificador y consentimiento. |

El carrusel y los convenios consultan los registros publicados del modulo Content. Los archivos estaticos vigentes se migran como registros editables; no se inventan noticias ni balances. La administracion limitada fue aprobada por FONASIN el 5 de octubre de 2026; ver ADR-005. Los banners provisionales permanecen `En curso` hasta reemplazo/aprobacion de piezas. Los convenios historicos conservan su ruta y ficha detallada original solo mientras su registro no haya sido editado. Para editar uno publicado se exige registrar las condiciones completas aprobadas por FONASIN; despues, la ficha usa titulo, categoria, resumen, condiciones, imagen y enlace del registro vigente. Si falta ese texto, se rechaza la edicion y no se pierde la ficha original. Los convenios nuevos sin URL externa obtienen una ficha con ruta basada en su ID estable. Despublicar cualquier registro retira tambien la ficha de su URL directa. La aceptacion visual de las fichas editadas sigue pendiente con FONASIN. El PDF de convenios no se ofrece en el panel hasta que se defina su necesidad y fuente.

## Afiliacion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-AFI-001 | Pagina informativa | Bloqueado | Contenido, requisitos y soportes oficiales. |
| FE-AFI-002 | Inicio o recuperacion de borrador | Implementado | La vista reutiliza por 24 horas el borrador de sesion del mismo navegador, consulta el borrador firmado en Backend y repuebla secciones/documentos ya guardados; no persiste datos personales en storage del frontend, requiere token tecnico de borrador y el Backend invalida el token al enviar. |
| FE-AFI-003 | Datos personales | Bloqueado | Esquema de campos aprobado. |
| FE-AFI-004 | Informacion laboral | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-005 | Informacion financiera | Implementado / pendiente aceptacion | Componentes hasta COP 10.000.000.000 y totales mensuales de ingresos/egresos hasta COP 20.000.000.000, calculados y validados en pantalla y servidor. Patrimonio conserva signo. Solo afiliacion inicial captura ahorro voluntario; completar/actualizar perfil excluye esos campos de pantalla, payload, validacion, persistencia y nuevos resumenes/PDF. Documentos anteriores se conservan. Ver ADR-009. |
| FE-AFI-006 | Beneficiarios | Bloqueado | Campos condicionales aprobados. |
| FE-AFI-006A | SARLAFT | Bloqueado | Declaraciones, campos y tratamiento aprobados. |
| FE-AFI-007 | Documentos | Implementado | Formulario exige PDF de identidad por ambos lados y certificado laboral; Backend valida PDF privado de hasta 5MB por documento. Falta validacion visual final con FONASIN. |
| FE-AFI-008 | Documentos generados | En curso | Backend genera formulario de afiliacion y autorizacion de descuento por nomina en PDF privado con firma electronica simple. Diego aporto el DOCX de `APORTES` el 8 de octubre de 2026; falta cotejo literal y visual, version/vigencia y aprobacion final del contenido y procedimiento de firma por FONASIN. Ver ADR-006. |
| FE-AFI-009 | Consentimientos | Bloqueado | Versiones oficiales de politica y estatutos. |
| FE-AFI-010 | Revision antes de envio | En curso | La vista de afiliacion muestra revision previa y permite corregir antes de enviar; falta validacion final de UX y textos. |
| FE-AFI-011 | Envio | Implementado | Endpoint de envio genera documentos, registra auditoria, cierra el borrador temporal, revoca el token tecnico y aplica rate limit para evitar nuevas mutaciones o abuso con enlaces antiguos. |
| FE-AFI-012 | Confirmacion | Implementado | Pantalla de confirmacion posterior al envio sin descarga directa obligatoria para el solicitante. |

La ruta `/afiliacion` contiene el flujo publico utilizable. Permanece pendiente la aprobacion formal de todos los textos, consentimientos y criterios documentales.

La devolucion para correccion conserva solicitud, motivo cifrado e historial.
El solicitante recibe un enlace privado de 24 horas; el formulario repuebla sus
datos y soportes y permite corregir y reenviar la misma solicitud. Los formularios
de asociados exigen tambien sesion del propietario. Un enlace vencido puede
reemitirse desde administracion; el asociado puede reanudar su propia correccion
desde el portal. Se revocan tokens anteriores y se exige nueva libranza empresarial
cuando se regenera la autorizacion inicial. Ver ADR-007 y pruebas del flujo.

## Administracion

ADR-009: la cartera del administrador y del asociado muestra ambas tasas sin ceros finales innecesarios, con coma decimal y sin convertir sus unidades. La ficha XLSX privada usa etiquetas en espanol para el catalogo de campos vigente y celdas numericas en importes conocidos; documentos, pagares, telefonos y referencias permanecen texto. Se mantiene proteccion contra formulas y control de acceso exclusivo para administrador.

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-ADM-001 a FE-ADM-009 | Gestion de afiliaciones y asociados | En curso | `/admin-fonasin`, endpoints paginados `GET /admin/affiliation-applications` y `GET /admin/associates`, acciones de revision, carga de libranza externa, habilitacion de asociado, deteccion de conflictos de identidad, alta manual, desactivacion logica e invalidacion de sesiones. `reviewer` conserva consulta, inicio de revision y solicitud de correccion; frontend oculta sus decisiones finales y controles de mutacion. Estas acciones son exclusivas de `admin` y estan cubiertas por pruebas HTTP y de presentacion. El detalle administrativo muestra las secciones descifradas de solicitudes pendientes y carga los PDF protegidos mediante sesion sin debilitar las cabeceras anti-iframe. Incluye ficha administrativa consolidada, busqueda HMAC por cedula en cuerpo POST, formulario vigente, cartera, aportes/ahorros y exportacion XLSX privada solo para admin. Falta validacion visual final con FONASIN. |
| FE-ADM-009A | Gestion manual de creditos | En curso | `/admin-fonasin`, endpoints `GET/POST/PATCH /admin/credits`, listado paginado, lineas cerradas de credito, solo asociados activos, transiciones basicas de estado y archivado logico. `reviewer` accede al listado en modo consulta; frontend oculta crear, editar, archivar e importar, acciones exclusivas de `admin` cubiertas por pruebas de permisos. Falta validacion visual final con FONASIN. |
| FE-ADM-010 | Importar cartera XLSX | Implementado / pendiente aceptacion | Plantilla de once columnas: documento, nombre_completo, linea_credito, numero_pagare, valor_inicial, valor_cuota, saldo_actual, fecha_ultimo_pago, Plazo, Tasa Int NA y Tasa Int mv. Plazo de 1 a 60 meses; tasas con unidades separadas, incluyendo celdas porcentuales numericas reales de Excel; importes limitados a DECIMAL(14,2). El pagare se cifra y se identifica por HMAC; se validan identidad y duplicados, se auditan cambios y un error tecnico termina el lote como fallido sin cambios parciales. |
| FE-ADM-010A | Importar aportes y ahorros XLSX | En curso | La pestana administrativa `Importaciones` muestra las plantillas aprobadas de Aporte Mensual, Ahorro Voluntario y Ahorro Permanente, cada una con documento, nombre, valor mensual, saldo y ultimo pago, seguidas por su historial operativo. Backend conserva historial, revierte correcciones y reconstruye los tres saldos sin depender del orden del archivo. Falta aceptacion operativa con datos de FONASIN y regla definitiva de conciliacion. |
| FE-ADM-010B | Consultar cuentas y movimientos de aportes | Implementado | `/admin-fonasin` incluye cuentas, saldos y libro de movimientos con filtros por asociado, estado, tipo y periodo; Backend expone consultas paginadas solo para admin/reviewer, valida filtros y audita accesos sin exponer hashes privados. |
| FE-ADM-010C | Preparar asociados desde XLSX | Implementado / pendiente aceptacion funcional | Alta manual y XLSX dejan al asociado antiguo inactivo. Aclaracion de Carlos registrada el 17 de octubre de 2026: el administrador de FONASIN carga la cedula privada que conserva (preferiblemente PDF), valida y activa individualmente con fecha/usuario; despues envia el enlace para establecer contrasena. El asociado completa `profile_completion` sin repetir afiliacion ni subir documentos. Pruebas HTTP cubren permisos, soporte privado, activacion auditada y perfil sin libranza. La decision documental esta resuelta; falta repetir la aceptacion funcional con FONASIN. Ver ADR-006. |
| FE-ADM-011 | Historial de importaciones | En curso | Backend expone `GET /admin/import-batches` con paginacion, permisos, auditoria y resumen de importaciones; `/admin-fonasin` incluye vista interna de historial con filtro por tipo, paginacion, errores resumidos y descarga CSV de filas rechazadas. Falta aprobacion final de operacion. |
| FE-ADM-012 | Prohibir alta manual irregular | Pendiente | Debe imponerse con permisos y casos de uso del Backend. |

## Portal y creditos privados

| ID | Requisito | Clase | Estado | Bloqueador o siguiente paso |
|---|---|---|---|---|
| FE-OBQ-001 | Ingreso y ciclo de contraseña | OBQ | En curso | Login con sesion Laravel, cambio obligatorio de clave inicial y recuperacion con correo, cedula, link temporal y bloqueo para asociados inactivos. Las altas nuevas no devuelven contrasenas temporales por API. | Validar SMTP de produccion y flujo visual final. |
| FE-OBQ-002 | Inicio privado | OBQ | En curso | Portal asociado existe con sesion, bloqueo por contrasena temporal y asociado activo; falta validacion visual final. |
| FE-OBQ-003 | Estado de cuenta | OBQ | En curso | El portal presenta en una sola pestana cuatro bloques independientes, delimitados visualmente y ordenados: creditos vigentes, aportes, ahorro permanente y ahorro voluntario. El ahorro voluntario distingue la solicitud mensual aprobada del saldo efectivamente recibido. El contrato consolidado `GET /portal/account-statement` y las importaciones XLSX siguen disponibles; falta validacion visual final con datos reales. |
| FE-OBQ-003A | Aportes y ahorros actuales | OBQ | En curso | Frontend representa `module_disabled`, `empty` y `available` dentro del estado de cuenta unificado. Backend expone `GET /portal/contributions` y `GET /portal/account-statement`. |
| FE-OBQ-004 | Aislamiento por sesion | OBQ | Implementado | Las consultas privadas resuelven el asociado desde la sesion y bloquean asociado inactivo; no se acepta `associate_id` del navegador. |
| FE-EXT-004 | Actualizacion de datos | EXT | En curso | El acceso publico "Actualizar datos" envia al login del portal y conserva la intencion para abrir directamente el flujo autenticado. El asociado crea o reutiliza un borrador temporal por 24 horas identificado como `data_update`; las altas operativas sin formulario usan `profile_completion`. Los flujos privados usan rutas y almacenamiento de sesion separados de `/afiliacion`, bloquean cambios de identidad y cargas documentales, generan solo el formulario y permiten al backoffice aplicarlo sin nueva libranza. Falta aprobacion visual final y definir retencion historica. |
| FE-EXT-004A | Solicitud de ahorro voluntario | EXT / otrosi aprobado por FONASIN | En curso | Solicitud privada, PDF y referencia visible; solo una pendiente. Revision favorable deja estado `awaiting_employer_authorization`; el PDF empresarial firmado y confirmado por administracion marca aprobacion definitiva. Tras ella puede haber nueva solicitud y coexistir aprobaciones; el historial privado se consulta por paginas sin recortar las antiguas. Carlos informa que FONASIN no tiene solicitudes historicas para migrar; se verifica la base destino antes del despliegue sin crear registros ficticios. Bibian confirmo el 8 de octubre: solicitud nueva, mismo formato de autorizacion de descuento por nomina y solo valor de ahorro voluntario, sin aporte. El portal muestra la autorizacion antes de aceptarla, el evento de auditoria registra la version del consentimiento y el PDF deja de afirmar una firma electronica verificada. Pendientes: cotejo visual y aceptacion final de FONASIN del documento/procedimiento de firmas. Ver ADR-006. |
| FE-EXT-005 | Simulador | EXT | Pendiente | No iniciar sin formulas y advertencias aprobadas. |
| FE-EXT-006 | Documentos privados | EXT | En curso | Storage privado con lectura autorizada y auditada; el asociado activo puede ver/descargar su propia libranza de ahorro voluntario, generada o firmada. No puede acceder a libranzas ajenas ni usar las rutas administrativas. |

## Pendientes de aceptacion y fuera de alcance

- Los tres modulos del otrosi forman parte del alcance aprobado segun confirmacion de Diego. La aprobacion de alcance no equivale a aceptacion funcional final de FONASIN.
- Aportes del asociado: saldo separado, consulta privada y carga XLSX; pendiente aceptacion con plantilla operativa de FONASIN.
- Ahorro permanente y ahorro voluntario: saldos, movimientos e importaciones separadas. Aprobar una solicitud voluntaria no crea un abono; el saldo real proviene del XLSX cargado por FONASIN. No se incluye integracion de nomina ni conciliacion bancaria automatica.
- Importacion de Excel/XLSX: implementada para cartera, aportes y ambos ahorros con plantillas separadas, validaciones, auditoria, storage privado y reporte por fila; falta aprobacion institucional final.
- Retencion automatica de FPQRS, documentos, solicitudes y auditoria: bloqueada hasta aprobacion juridica y operativa.
- Rotacion operativa de `DATA_HASH_PEPPER`: pendiente de procedimiento formal. Los hashes sensibles de documento, correo, IP y agente de usuario ya usan HMAC-SHA256 y requieren pepper estable por entorno.
- Auditoria append-only reforzada por MariaDB: pendiente de definicion de permisos/triggers en el entorno productivo.

La pagina publica `/creditos` solo cubre informacion general de `FE-WEB-004`; no cuenta como consulta privada `FE-OBQ-003`.

## Calidad y evidencia obligatoria

### Regresiones de cierre del 15 de octubre de 2026

- FE-ADM-001 a FE-ADM-009: libranza empresarial exclusivamente PDF, hasta 5 MB,
  tanto en el selector como en la validacion HTTP y el caso de uso. JPG/PNG,
  imagen renombrada a PDF y PDF sobredimensionado se rechazan sin registro ni
  archivo; la carga valida mantiene su prueba positiva.
- FE-ADM-009A: el listado permite marcar pagado solo un credito activo y
  archivar uno activo o pagado. No ofrece reactivar un credito pagado; el
  servidor conserva su prohibicion de `settled -> active`.
- FE-OBQ-001 / FE-OBQ-004: una cuenta inactiva pierde tambien una sesion
  existente. Se comprueban admin (lectura y escritura), reviewer, asociado,
  consulta de sesion y cambio de contrasena. El servidor invalida la sesion
  y registra su cierre; los usuarios activos y visitantes publicos no cambian.
- La dependencia HTTP productiva se actualiza de forma acotada a
  symfony/http-foundation 7.4.21. Hay regresiones de Cache-Control y separacion
  por espacios, ademas del control `composer audit` completo en CI.

Estas verificaciones tecnicas no sustituyen la aceptacion de FONASIN ni una
prueba del transporte SMTP y la configuracion de produccion.

La actualizacion de seguridad del tooling CSS (ADR-008) conserva los estilos
existentes mediante tokens y utilidades de compatibilidad. Vitest comprueba
su inventario y `test:theme` verifica colores, espacios y controles en navegador
a 1440/390px. CI audita npm completo desde low, no solo produccion. Este control
responsive acotado no equivale a una auditoria integral de accesibilidad ni a
aceptacion visual institucional.

| Control | Estado | Evidencia requerida para `Validado` |
|---|---|---|
| Compilacion TypeScript/Vite | Implementado | `npm run build` local y workflow `.github/workflows/quality-gates.yml` en cada push y pull request con cambios de codigo. |
| Rutas SPA en Apache | Implementado | `public/.htaccess` incluido en `dist` y recarga directa verificada. |
| Pruebas unitarias | En curso | Vitest y Testing Library cubren rutas, roles admin/reviewer, validacion XLSX, navegacion y estados del portal. La prueba Browser integrada usa datos ficticios; faltan ejemplos operativos anonimizados y aceptacion institucional. |
| Pruebas de integracion | En curso | Pruebas Feature cubren afiliacion publica, links vencidos, documentos protegidos, portal asociado, estado de cuenta, actualizacion de datos y cierre de sesion. El flujo de aportes/ahorros tiene E2E con MariaDB y navegador real en CI; falta validacion con archivos institucionales anonimizados. |
| Responsive | Pendiente | Matriz movil, tableta y escritorio. |
| Accesibilidad | Pendiente | Teclado, foco, labels, contraste, semantica y auditoria. |
| Permisos | En curso | Casos HTTP positivos y negativos por rol, propietario y estado; completar la matriz de aceptacion institucional. |
| Regresion | Implementado | `quality-gates.yml` cubre backend SQLite, MariaDB, frontend y Browser del otrosi; el deploy de cPanel solo publica frontend. |

## Seguridad de recuperacion y exportacion

Seguridad de cierre: la recuperacion vence a los 60 minutos, es de un solo
uso, revoca sesiones de la cuenta y limita intentos por cuenta/IP. El recorrido
de navegador prueba dos dispositivos y el nuevo ingreso sin firmar
automaticamente al navegador de recuperacion. La exportacion XLSX del panel
conserva texto literal frente a etiquetas de formulas y enlaces. Son controles
tecnicos del alcance existente, no nuevas funciones ni aceptacion contractual.

## Regla para cada PR

Toda PR que afecte Frontend debe:

1. indicar los IDs que atiende;
2. actualizar el estado y la evidencia de esta matriz;
3. distinguir contenido provisional de contenido aprobado;
4. incluir estados de carga, vacio, error y sin permiso cuando apliquen;
5. ejecutar build, pruebas aplicables y `git diff --check`;
6. no marcar `Aceptado` sin aprobacion expresa de FONASIN.
