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

- Suite backend completa: 591 pruebas, 3806 aserciones, todas correctas en
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
