# Trazabilidad de requisitos Frontend

## Proposito

Esta matriz conecta la especificacion funcional con el codigo, las pruebas y la aceptacion de FONASIN. Es obligatoria para revisar avance: una pantalla visible no equivale por si sola a un requisito cumplido.

Fuente funcional: `02_GUIA_EQUIPO_FRONTEND_WEB_AFILIACION_PORTAL_V2.docx`, version 2.0 del 15 de agosto de 2026.

Ultima revision tecnica: 24 de septiembre de 2026, rama de trabajo frontend.

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
| FE-WEB-004 | Productos y servicios | En curso | `/productos-y-servicios`, `/creditos`, ahorros y convenios | Aprobar nombres, textos, condiciones y beneficios. |
| FE-WEB-005 | Transparencia | Implementado | Centro documental con estatutos, politica de datos, manual de lineas de credito, reglamento de cartera y estados financieros 2025 | Validar visualmente los documentos publicados con FONASIN. |
| FE-WEB-005A | Visor PDF | Implementado | Visor embebido y descarga disponible para cada documento institucional | Validar rendimiento del estado financiero escaneado en el hosting productivo. |
| FE-WEB-006 | Noticias | Bloqueado | Sin ruta ni datos | Recibir publicaciones iniciales aprobadas; no crear CMS general. |
| FE-WEB-007 | Contacto | En curso | WhatsApp, correo institucional, mapa, horario y acceso a FPQRS publicados | Confirmar y conectar las redes sociales oficiales. |
| FE-WEB-008 | FPQRS | Implementado | Formulario conectado a `POST /fpqrs-submissions`, adjunto opcional PDF/JPG/PNG hasta 5MB, estados de envio/error, rate limit publico y entrega a correo institucional por backend. | Validar envio real con SMTP de produccion y aprobar politica de retencion. |
| FE-WEB-009 | WhatsApp | En curso | Enlace configurable con `VITE_WHATSAPP_URL` | Confirmar numero, mensaje y comportamiento oficial. |
| FE-WEB-010 | SEO y accesibilidad | En curso | HTML en español, description, semantica y foco parcial | Ejecutar auditoria sin errores criticos y agregar pruebas. |
| FE-WEB-011 | Transacciones y QR | Pendiente | Acceso marcado `Proximamente` | Publicar QR, destino, concepto, instrucciones, advertencia y descarga. |
| FE-WEB-012 | Analitica opcional | Pendiente | No integrada | Requiere aprobacion de finalidad, identificador y consentimiento. |

El carrusel estatico de tres imagenes existe, pero permanece `En curso` hasta recibir y aprobar piezas oficiales de FONASIN. No se implementara biblioteca de medios ni administracion de imagenes porque estan fuera del alcance vigente.

## Afiliacion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-AFI-001 | Pagina informativa | Bloqueado | Contenido, requisitos y soportes oficiales. |
| FE-AFI-002 | Inicio o recuperacion de borrador | Implementado | La vista reutiliza por 24 horas el borrador de sesion del mismo navegador, consulta el borrador firmado en Backend y repuebla secciones/documentos ya guardados; no persiste datos personales en storage del frontend, requiere token tecnico de borrador y el Backend invalida el token al enviar. |
| FE-AFI-003 | Datos personales | Bloqueado | Esquema de campos aprobado. |
| FE-AFI-004 | Informacion laboral | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-005 | Informacion financiera | En curso | Los montos editables admiten correccion normal; ingresos, egresos y patrimonio se calculan automaticamente y Backend rechaza totales incoherentes. Falta aprobacion institucional final de campos y reglas. |
| FE-AFI-006 | Beneficiarios | Bloqueado | Campos condicionales aprobados. |
| FE-AFI-006A | SARLAFT | Bloqueado | Declaraciones, campos y tratamiento aprobados. |
| FE-AFI-007 | Documentos | Implementado | Formulario exige PDF de identidad por ambos lados y certificado laboral; Backend valida PDF privado de hasta 5MB por documento. Falta validacion visual final con FONASIN. |
| FE-AFI-008 | Documentos generados | En curso | Backend genera formulario de afiliacion y autorizacion de descuento por nomina en PDF privado con firma electronica simple; falta aprobacion final de contenido juridico/diseno por FONASIN. |
| FE-AFI-009 | Consentimientos | Bloqueado | Versiones oficiales de politica y estatutos. |
| FE-AFI-010 | Revision antes de envio | En curso | La vista de afiliacion muestra revision previa y permite corregir antes de enviar; falta validacion final de UX y textos. |
| FE-AFI-011 | Envio | Implementado | Endpoint de envio genera documentos, registra auditoria, cierra el borrador temporal, revoca el token tecnico y aplica rate limit para evitar nuevas mutaciones o abuso con enlaces antiguos. |
| FE-AFI-012 | Confirmacion | Implementado | Pantalla de confirmacion posterior al envio sin descarga directa obligatoria para el solicitante. |

La ruta `/afiliacion` contiene el flujo publico utilizable. Permanece pendiente la aprobacion formal de todos los textos, consentimientos y criterios documentales.

## Administracion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-ADM-001 a FE-ADM-009 | Gestion de afiliaciones y asociados | En curso | `/admin-fonasin`, endpoints paginados `GET /admin/affiliation-applications` y `GET /admin/associates`, acciones de revision, carga de libranza externa, habilitacion de asociado, deteccion de conflictos de identidad, alta manual, desactivacion logica e invalidacion de sesiones. `reviewer` conserva consulta, inicio de revision y solicitud de correccion; frontend oculta sus decisiones finales y controles de mutacion. Estas acciones son exclusivas de `admin` y estan cubiertas por pruebas HTTP y de presentacion. El detalle administrativo muestra las secciones descifradas de solicitudes pendientes y carga los PDF protegidos mediante sesion sin debilitar las cabeceras anti-iframe. Incluye ficha administrativa consolidada, busqueda HMAC por cedula en cuerpo POST, formulario vigente, cartera, aportes/ahorros y exportacion XLSX privada solo para admin. Falta validacion visual final con FONASIN. |
| FE-ADM-009A | Gestion manual de creditos | En curso | `/admin-fonasin`, endpoints `GET/POST/PATCH /admin/credits`, listado paginado, lineas cerradas de credito, solo asociados activos, transiciones basicas de estado y archivado logico. `reviewer` accede al listado en modo consulta; frontend oculta crear, editar, archivar e importar, acciones exclusivas de `admin` cubiertas por pruebas de permisos. Falta validacion visual final con FONASIN. |
| FE-ADM-010 | Importar cartera XLSX | En curso | Frontend y Backend usan la estructura operativa de ocho columnas: documento, nombre, linea, pagare, saldos, cuota y ultimo pago. El pagare se cifra y se identifica por HMAC; la carga valida identidad, formatos colombianos, duplicados y audita cambios. Falta aprobacion institucional final de la plantilla. |
| FE-ADM-010A | Importar aportes y ahorros XLSX | En curso | La pestana administrativa `Importaciones` muestra las plantillas y cargas separadas para aporte ordinario, ahorro voluntario y ahorro permanente, cada una con documento, nombre, valor mensual, saldo y ultimo pago, seguidas por su historial operativo. Backend conserva historial, revierte correcciones y reconstruye los tres saldos sin depender del orden del archivo. Falta aprobacion institucional final y regla definitiva de conciliacion. |
| FE-ADM-010B | Consultar cuentas y movimientos de aportes | Implementado | `/admin-fonasin` incluye cuentas, saldos y libro de movimientos con filtros por asociado, estado, tipo y periodo; Backend expone consultas paginadas solo para admin/reviewer, valida filtros y audita accesos sin exponer hashes privados. |
| FE-ADM-010C | Preparar asociados desde XLSX | En curso | Admin dispone de plantilla y carga privada con documento, nombre completo y correo, validacion por fila, duplicados, historial y reporte de errores. La carga no divide nombres ni envia correos automaticamente; la activacion es individual, auditada y conduce al formulario `profile_completion` sin soportes ni libranza. Falta aprobacion institucional de plantilla y validacion SMTP en produccion. |
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
| FE-EXT-004A | Solicitud de ahorro voluntario | EXT | En curso | El acceso publico lleva al login y abre una pantalla privada independiente de afiliacion. El asociado registra en pesos enteros un monto mensual limitado a $10.000.000.000 y confirma la solicitud; MariaDB conserva el tramite y administracion puede aprobar o rechazar con auditoria. La creacion y la decision administrativa usan transacciones con bloqueo, y una restriccion unica impide dos solicitudes pendientes del mismo asociado incluso ante concurrencia. Genera una libranza institucional completa cuyo unico concepto y total es el ahorro voluntario, sin incluir aporte obligatorio. Tras aprobar, administracion puede cargar la libranza firmada una sola vez; esta sustituye visualmente a la generada, mientras ambas permanecen privadas y auditadas. Falta aprobacion institucional formal del alcance antes de desplegar en produccion. |
| FE-EXT-005 | Simulador | EXT | Pendiente | No iniciar sin formulas y advertencias aprobadas. |
| FE-EXT-006 | Documentos privados | EXT | En curso | Storage privado y vista temporal autorizada para documentos visibles al asociado; la libranza no se muestra en el portal asociado. |

## Pendientes explicitamente fuera de la entrega actual

- Aportes del asociado: existe saldo separado, consulta privada y carga XLSX; faltan datos representativos y aprobacion institucional final.
- Ahorro permanente y ahorro voluntario: existen saldos, movimientos e importaciones separadas. La apertura de ahorro voluntario cuenta con solicitud privada y libranza administrativa; falta aprobacion institucional y la regla final de conciliacion posterior a su aprobacion.
- Importacion de Excel/XLSX: implementada para cartera, aportes y ambos ahorros con plantillas separadas, validaciones, auditoria, storage privado y reporte por fila; falta aprobacion institucional final.
- Retencion automatica de FPQRS, documentos, solicitudes y auditoria: bloqueada hasta aprobacion juridica y operativa.
- Rotacion operativa de `DATA_HASH_PEPPER`: pendiente de procedimiento formal. Los hashes sensibles de documento, correo, IP y agente de usuario ya usan HMAC-SHA256 y requieren pepper estable por entorno.
- Auditoria append-only reforzada por MariaDB: pendiente de definicion de permisos/triggers en el entorno productivo.

La pagina publica `/creditos` solo cubre informacion general de `FE-WEB-004`; no cuenta como consulta privada `FE-OBQ-003`.

## Calidad y evidencia obligatoria

| Control | Estado | Evidencia requerida para `Validado` |
|---|---|---|
| Compilacion TypeScript/Vite | Implementado | `npm run build` local y workflow `.github/workflows/frontend-ci.yml` en cada push y pull request. |
| Rutas SPA en Apache | Implementado | `public/.htaccess` incluido en `dist` y recarga directa verificada. |
| Pruebas unitarias | En curso | Vitest y Testing Library cubren rutas, roles admin/reviewer, validacion XLSX, navegacion y estados del portal; falta complementar con Browser/E2E contra contratos reales. |
| Pruebas de integracion | En curso | Pruebas Feature cubren afiliacion publica, links vencidos, documentos protegidos, portal asociado, estado de cuenta, documentos, actualizacion de datos y cierre de sesion. Frontend cubre cambio obligatorio de contrasena hacia `profile_completion` y resolucion de URLs de documentos contra el backend configurado; falta prueba Browser visual end to end. |
| Responsive | Pendiente | Matriz movil, tableta y escritorio. |
| Accesibilidad | Pendiente | Teclado, foco, labels, contraste, semantica y auditoria. |
| Permisos | Pendiente | Casos positivos y negativos por rol. |
| Regresion | Pendiente | Pipeline sobre rutas publicas y privadas. |

## Regla para cada PR

Toda PR que afecte Frontend debe:

1. indicar los IDs que atiende;
2. actualizar el estado y la evidencia de esta matriz;
3. distinguir contenido provisional de contenido aprobado;
4. incluir estados de carga, vacio, error y sin permiso cuando apliquen;
5. ejecutar build, pruebas aplicables y `git diff --check`;
6. no marcar `Aceptado` sin aprobacion expresa de FONASIN.
