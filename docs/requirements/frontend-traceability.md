# Trazabilidad de requisitos Frontend

## Proposito

Esta matriz conecta la especificacion funcional con el codigo, las pruebas y la aceptacion de FONASIN. Es obligatoria para revisar avance: una pantalla visible no equivale por si sola a un requisito cumplido.

Fuente funcional: `02_GUIA_EQUIPO_FRONTEND_WEB_AFILIACION_PORTAL_V2.docx`, version 2.0 del 15 de agosto de 2026.

Ultima revision tecnica: 16 de agosto de 2026, rama `develop`, commit base `93e594a`.

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
| FE-WEB-008 | FPQRS | En curso | Formulario visual y servicio simulado; Backend disponible en `POST /fpqrs-submissions` con entrega a correo institucional | Conectar frontend al endpoint real y probar estados/error. |
| FE-WEB-009 | WhatsApp | En curso | Enlace configurable con `VITE_WHATSAPP_URL` | Confirmar numero, mensaje y comportamiento oficial. |
| FE-WEB-010 | SEO y accesibilidad | En curso | HTML en español, description, semantica y foco parcial | Ejecutar auditoria sin errores criticos y agregar pruebas. |
| FE-WEB-011 | Transacciones y QR | Pendiente | Acceso marcado `Proximamente` | Publicar QR, destino, concepto, instrucciones, advertencia y descarga. |
| FE-WEB-012 | Analitica opcional | Pendiente | No integrada | Requiere aprobacion de finalidad, identificador y consentimiento. |

El carrusel estatico de tres imagenes existe, pero permanece `En curso` hasta recibir y aprobar piezas oficiales de FONASIN. No se implementara biblioteca de medios ni administracion de imagenes porque estan fuera del alcance vigente.

## Afiliacion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-AFI-001 | Pagina informativa | Bloqueado | Contenido, requisitos y soportes oficiales. |
| FE-AFI-002 | Inicio o recuperacion de borrador | Implementado | La vista reutiliza por 24 horas el borrador local del mismo navegador, consulta el borrador firmado en Backend y repuebla secciones/documentos ya guardados; no persiste datos personales en storage del frontend. |
| FE-AFI-003 | Datos personales | Bloqueado | Esquema de campos aprobado. |
| FE-AFI-004 | Informacion laboral | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-005 | Informacion financiera | Bloqueado | Campos y reglas aprobados. |
| FE-AFI-006 | Beneficiarios | Bloqueado | Campos condicionales aprobados. |
| FE-AFI-006A | SARLAFT | Bloqueado | Declaraciones, campos y tratamiento aprobados. |
| FE-AFI-007 | Documentos | Implementado | Formulario exige PDF de identidad por ambos lados y certificado laboral; Backend valida PDF privado de hasta 5MB por documento. Falta validacion visual final con FONASIN. |
| FE-AFI-008 | Documentos generados | Pendiente | Contrato de generacion y descarga PDF. |
| FE-AFI-009 | Consentimientos | Bloqueado | Versiones oficiales de politica y estatutos. |
| FE-AFI-010 | Resumen | Pendiente | Depende de las etapas anteriores. |
| FE-AFI-011 | Envio | Pendiente | Endpoint, idempotencia y estados Backend. |
| FE-AFI-012 | Confirmacion | Pendiente | Depende de envio confirmado por Backend. |

La ruta actual `/afiliacion` es un aviso explicito y no se considera implementacion del flujo.

## Administracion

| ID | Requisito | Estado | Bloqueador o siguiente paso |
|---|---|---|---|
| FE-ADM-001 a FE-ADM-009 | Gestion de afiliaciones y asociados | En curso | `/admin-fonasin`, endpoints `GET /admin/affiliation-applications`, acciones de revision, carga de libranza externa, habilitacion de asociado y modulo administrativo de asociados con alta manual y desactivacion logica. Falta validacion visual final con FONASIN. |
| FE-ADM-010 | Importar creditos XLSX | Bloqueado | Plantilla, columnas, validaciones y contrato de importacion aprobados. |
| FE-ADM-011 | Historial de importaciones | Pendiente | Depende del caso de uso de importacion y auditoria. |
| FE-ADM-012 | Prohibir alta manual irregular | Pendiente | Debe imponerse con permisos y casos de uso del Backend. |

## Portal y creditos privados

| ID | Requisito | Clase | Estado | Bloqueador o siguiente paso |
|---|---|---|---|---|
| FE-OBQ-001 | Ingreso y ciclo de contraseña | OBQ | Pendiente | Identity, correo y politicas de seguridad. |
| FE-OBQ-002 | Inicio privado | OBQ | Pendiente | Afiliado aprobado, activo, habilitado y autenticado. |
| FE-OBQ-003 | Creditos actuales | OBQ | Pendiente | Importacion de creditos y consulta autorizada por sesion. |
| FE-OBQ-004 | Aislamiento por sesion | OBQ | Pendiente | Policy Backend; nunca aceptar identificador del navegador. |
| FE-EXT-004 | Actualizacion de datos | EXT | Pendiente | No iniciar sin aprobacion de alcance y flujo. |
| FE-EXT-005 | Simulador | EXT | Pendiente | No iniciar sin formulas y advertencias aprobadas. |
| FE-EXT-006 | Documentos privados | EXT | Pendiente | Storage privado y descarga temporal autorizada. |

La pagina publica `/creditos` solo cubre informacion general de `FE-WEB-004`; no cuenta como consulta privada `FE-OBQ-003`.

## Calidad y evidencia obligatoria

| Control | Estado | Evidencia requerida para `Validado` |
|---|---|---|
| Compilacion TypeScript/Vite | Implementado | `npm run build` local y workflow `.github/workflows/frontend-ci.yml` en cada push y pull request. |
| Rutas SPA en Apache | Implementado | `public/.htaccess` incluido en `dist` y recarga directa verificada. |
| Pruebas unitarias | En curso | Vitest y Testing Library cubren rutas y navegacion; ampliar a componentes y utilidades criticas. |
| Pruebas de integracion | Pendiente | Formularios, archivos, errores y confirmaciones. |
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
