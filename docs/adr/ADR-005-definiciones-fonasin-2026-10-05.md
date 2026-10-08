# ADR-005 — Definiciones funcionales de FONASIN del 5 de octubre de 2026

Estado: aprobado funcionalmente por FONASIN; implementación técnica en revisión local. Fuente: respuesta escrita de Bibian transmitida por Carlos el 5 de octubre de 2026. La aprobación de reglas no equivale a aceptación de la entrega.

Actualizacion: las precisiones transmitidas por Carlos el 7 de octubre sobre creditos, historial y asociados antiguos se registran en ADR-006. Los puntos 2 a 4 de este documento conservan el contexto original, pero no deben usarse solos como instruccion de implementacion vigente.

## Decisiones

1. Una solicitud de ahorro voluntario pendiente impide otra. Un rechazo conserva el registro y permite una solicitud nueva. Después de la aprobación definitiva, el asociado puede iniciar otra; aprobaciones anteriores no se cancelan ni sustituyen.
2. La revisión favorable de FONASIN **no** es la aprobación definitiva. Para ahorro voluntario y para créditos sujetos a descuento por nómina, esta última exige el PDF con la firma/autorización de la empresa contratante. El documento generado y aceptado por el asociado, el envío a la empresa y el documento devuelto son etapas distintas.
3. El formato y texto oficial de libranza ya fueron entregados a Carlos, pero no están identificados en este repositorio. No se sustituye por una plantilla inventada. Carlos debe entregar el archivo/versionado y comparar los PDF generados antes de habilitar aceptación de este flujo. El sistema actual de créditos administra cartera existente; no implementa una solicitud de crédito ni puede inferir de sus registros cuáles se descuentan por nómina. Esa parte no se declara cerrada.
4. Los asociados antiguos pueden darse de alta sin rehacer la afiliación digital. Permanecen inactivos hasta que `admin` cargue copia privada de la cédula y valide individualmente. Se registra usuario, fecha y evento de auditoría. Los usuarios/expedientes preexistentes no son modificados por la migración.
5. Las plantillas separadas de Aporte Mensual, Ahorro Permanente y Ahorro Voluntario son las aprobadas. `Valor mensual` no se suma al saldo; el saldo es el acumulado a la fecha de corte. En portal se muestra `Mes del último pago` y `Fecha del último pago`; el estado técnico del movimiento no es estado de asociado.
6. FONASIN administra noticias, Balance Social, enlaces sociales, correo oficial, convenios y banners desde el panel. La API solo devuelve elementos publicados; documentos subidos permanecen privados hasta su publicación. Redes sin enlace oficial no se muestran. La distribución 70/30 del 1,5 % del salario no cambia.

## Datos y compatibilidad

- `associates`: bandera de validación de legado, clave privada de cédula, MIME, fecha y usuario validador. Default `false` para no alterar asociados previos.
- `voluntary_savings_requests`: nuevo estado `awaiting_employer_authorization`. La revisión favorable mantiene la exclusividad de pendiente; la carga firmada marca `approved` y libera esa exclusividad. No se generan movimientos financieros con la aprobación.
- `public_content_items` y `public_site_settings`: contenidos limitados por tipo, publicación, orden y auditoría. La migración incorpora convenios y banners ya visibles como registros editables; noticias e informes no reciben contenido inventado.
- Los `approved` históricos de ahorro voluntario sin PDF firmado **no** se transforman automáticamente: pueden reflejar decisiones previas hechas bajo otra regla. Antes de despliegue, Diego y FONASIN deben revisar su cantidad e identidad con una consulta de solo lectura y decidir su clasificación; nunca fabricar una firma ni borrar el historial.

## Pendientes externos para aceptación

- Carlos: entregar formato oficial de libranza y versión aprobada; mapear cada campo y texto contra los PDF de afiliación y ahorro voluntario y definir el formulario de solicitud de crédito. La regla de firma empresarial aplicará a ambos, pero no se declara implementada para créditos hasta contar con ese insumo.
- FONASIN: enlaces oficiales de redes y contenido futuro. Nuevos comunicados/informes/convenios pueden quedar como borrador hasta aprobación.
- Diego/FONASIN: revisar registros de ahorro voluntario históricos que figuren `approved` sin libranza firmada antes de promover esta versión a producción.

## Evidencia técnica exigida

Pruebas HTTP de permisos y estados, pruebas de vistas React, build, revisión local visual y regresión de MariaDB en CI. La producción no se usa para probar estas reglas.
