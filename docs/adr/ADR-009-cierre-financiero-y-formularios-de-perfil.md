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
