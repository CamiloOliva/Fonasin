# Trazabilidad de requisitos Frontend

## Proposito

Esta matriz conecta la especificacion funcional con el codigo, las pruebas y la aceptacion de FONASIN. Es obligatoria para revisar avance: una pantalla visible no equivale por si sola a un requisito cumplido.

Fuente funcional: `02_GUIA_EQUIPO_FRONTEND_WEB_AFILIACION_PORTAL_V2.docx`, version 2.0 del 15 de agosto de 2026.

Ultima revision tecnica: 4 de septiembre de 2026, rama `feature/security-portal-p1-fixes`, commit base `731e3e8`.

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
| FE-WEB-003 | Institucional | En curso | Secciones About, History y Documents | Publicar valores y documentos oficiales sin enlaces simulados. |
| FE-WEB-004 | Productos y servicios | En curso | `/productos-y-servicios`, `/creditos`, ahorros y convenios | Aprobar nombres, textos, condiciones y beneficios. |
| FE-WEB-005 | Transparencia | Bloqueado | Tarjetas documentales sin archivos | Recibir estatutos, reglamentos, balances, informes, fechas y tipos. |
| FE-WEB-005A | Visor PDF | Pendiente | Sin visor | Mostrar PDF embebido con descarga y fallback accesible. |
| FE-WEB-006 | Noticias | Bloqueado | Sin ruta ni datos | Recibir publicaciones iniciales aprobadas; no crear CMS general. |
| FE-WEB-007 | Contacto | Bloqueado | WhatsApp parcial | Recibir datos, redes, mapa y horarios oficiales. |
| FE-WEB-008 | FPQRS | Implementado | Formulario conectado a `POST /fpqrs-submissions`, adjunto opcional PDF/JPG/PNG hasta 5MB, estados de envio/error y entrega a correo institucional por backend. | Validar envio real con SMTP de produccion. |
| FE-WEB-009 | WhatsApp | En curso | Enlace configurable con `VITE_WHATSAPP_URL` | Confirmar numero, mensaje y comportamiento oficial. |
| FE-WEB-010 | SEO y accesibilidad | En curso | HTML en español, description, semantica y foco parcial | Ejecutar auditoria sin errores criticos y agregar pruebas. |
| FE-WEB-011 | Transacciones y QR | Pendiente | Acceso marcado `Proximamente` | Publicar QR, destino, concepto, instrucciones, advertencia y descarga. |
| FE-WEB-012 | Analitica opcional | Pendiente | No integrada | Requiere aprobacion de finalidad, identificador y consentimiento. |

El carrusel estatico de tres imagenes existe, pero permanece `En curso` hasta recibir y aprobar piezas oficiales de FONASIN. No se implementara biblioteca de medios ni administracion de imagenes porque estan fuera del alcance vigente.

## Afiliacion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-AFI-001 | Pagina informativa | Bloqueado | Contenido, requisitos y soportes oficiales. |
| FE-AFI-002 | Inicio o recuperacion de borrador | Implementado | La vista reutiliza por 24 horas el borrador local del mismo navegador, consulta el borrador firmado en Backend y repuebla secciones/documentos ya guardados; no persiste datos personales en storage del frontend, requiere token tecnico de borrador y el Backend invalida el token al enviar. |
| FE-AFI-003 | Datos personales | Bloqueado | Esquema de campos aprobado. |
| FE-AFI-004 | Informacion laboral | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-005 | Informacion financiera | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-006 | Beneficiarios | Bloqueado | Campos condicionales aprobados. |
| FE-AFI-006A | SARLAFT | Bloqueado | Declaraciones, campos y tratamiento aprobados. |
| FE-AFI-007 | Documentos | Implementado | Formulario exige PDF de identidad por ambos lados y certificado laboral; Backend valida PDF privado de hasta 5MB por documento. Falta validacion visual final con FONASIN. |
| FE-AFI-008 | Documentos generados | En curso | Backend genera formulario de afiliacion y autorizacion de descuento por nomina en PDF privado con firma electronica simple; falta aprobacion final de contenido juridico/diseno por FONASIN. |
| FE-AFI-009 | Consentimientos | Bloqueado | Versiones oficiales de politica y estatutos. |
| FE-AFI-010 | Revision antes de envio | En curso | La vista de afiliacion muestra revision previa y permite corregir antes de enviar; falta validacion final de UX y textos. |
| FE-AFI-011 | Envio | Implementado | Endpoint de envio genera documentos, registra auditoria, cierra el borrador temporal y revoca el token tecnico para evitar nuevas mutaciones con enlaces antiguos. |
| FE-AFI-012 | Confirmacion | Implementado | Pantalla de confirmacion posterior al envio sin descarga directa obligatoria para el solicitante. |

La ruta `/afiliacion` contiene el flujo publico utilizable. Permanece pendiente la aprobacion formal de todos los textos, consentimientos y criterios documentales.

## Administracion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-ADM-001 a FE-ADM-009 | Gestion de afiliaciones y asociados | En curso | `/admin-fonasin`, endpoints `GET /admin/affiliation-applications`, acciones de revision, carga de libranza externa, habilitacion de asociado, deteccion de conflictos de identidad y modulo administrativo de asociados con alta manual, usuario de portal y desactivacion logica. Falta validacion visual final con FONASIN. |
| FE-ADM-009A | Gestion manual de creditos | En curso | `/admin-fonasin`, endpoints `GET/POST/PATCH /admin/credits`, listado paginado, lineas cerradas de credito, solo asociados activos, transiciones basicas de estado y archivado logico. Falta validacion visual final con FONASIN. |
| FE-ADM-010 | Importar creditos XLSX | Bloqueado | Plantilla, columnas, validaciones y contrato de importacion aprobados. |
| FE-ADM-011 | Historial de importaciones | Pendiente | Depende del caso de uso de importacion y auditoria. |
| FE-ADM-012 | Prohibir alta manual irregular | Pendiente | Debe imponerse con permisos y casos de uso del Backend. |

## Portal y creditos privados

| ID | Requisito | Clase | Estado | Bloqueador o siguiente paso |
|---|---|---|---|---|
| FE-OBQ-001 | Ingreso y ciclo de contraseña | OBQ | En curso | Login con sesion Laravel, cambio obligatorio de contrasena temporal y recuperacion con correo, cedula y link temporal. | Validar SMTP de produccion y flujo visual final. |
| FE-OBQ-002 | Inicio privado | OBQ | En curso | Portal asociado existe con sesion, bloqueo por contrasena temporal y asociado activo; falta validacion visual final. |
| FE-OBQ-003 | Creditos actuales | OBQ | En curso | Consulta creditos del asociado autenticado desde Backend; importacion de creditos sigue pendiente. |
| FE-OBQ-004 | Aislamiento por sesion | OBQ | Implementado | Las consultas privadas resuelven el asociado desde la sesion y bloquean asociado inactivo; no se acepta `associate_id` del navegador. |
| FE-EXT-004 | Actualizacion de datos | EXT | En curso | El asociado puede crear/reutilizar un borrador temporal de actualizacion por 24 horas; el Backend usa transaccion e indice unico parcial para evitar borradores duplicados activos. Falta aprobacion final del flujo y de retencion. |
| FE-EXT-005 | Simulador | EXT | Pendiente | No iniciar sin formulas y advertencias aprobadas. |
| FE-EXT-006 | Documentos privados | EXT | En curso | Storage privado y vista temporal autorizada para documentos visibles al asociado; la libranza no se muestra en el portal asociado. |

## Pendientes explicitamente fuera de la entrega actual

- Aportes del asociado: pantalla visible sin datos reales ni importacion implementada.
- Ahorro permanente y ahorro voluntario: no existe modelo operativo ni carga administrativa aprobada.
- Importacion de Excel/XLSX: bloqueada hasta definir plantilla, validaciones, auditoria y manejo de errores.

La pagina publica `/creditos` solo cubre informacion general de `FE-WEB-004`; no cuenta como consulta privada `FE-OBQ-003`.

## Calidad y evidencia obligatoria

| Control | Estado | Evidencia requerida para `Validado` |
|---|---|---|
| Compilacion TypeScript/Vite | Implementado | `npm run build` local y workflow `.github/workflows/frontend-ci.yml` en cada push y pull request. |
| Rutas SPA en Apache | Implementado | `public/.htaccess` incluido en `dist` y recarga directa verificada. |
| Pruebas unitarias | En curso | Vitest y Testing Library cubren rutas y navegacion; ampliar a componentes y utilidades criticas. |
| Pruebas de integracion | En curso | Pruebas Feature cubren afiliacion publica, links vencidos, documentos protegidos, portal asociado, documentos y actualizacion de datos; falta prueba Browser visual end to end. |
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
