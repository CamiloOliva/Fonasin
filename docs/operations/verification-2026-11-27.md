# Cierre de pendientes antes de main

Base revisada: develop 1c1a944. Carlos confirmo por escrito el 27 de noviembre
de 2026: 24 horas para asociados y 2 horas para administradores y revisores.
Esta decision sustituye el plazo comun del 26 de noviembre; una cuenta con
roles mixtos se trata como interna y usa dos horas. Sin rol identificado, el
limite tambien es de dos horas.

## Correccion de correo y recuperacion simultaneas

El restablecimiento bloqueaba primero el token y despues el usuario, mientras
la correccion hacia lo contrario. Ademas, solicitar recuperacion no bloqueaba
el usuario y podia conservar un correo leido antes de la correccion.

LockPasswordRecoveryUser busca el ID sin bloquear el indice de correo, bloquea
la fila por su clave primaria y vuelve a comparar el correo despues de esperar.
Las operaciones de recuperacion bloquean usuario antes de tokens, de forma
compatible con la correccion administrativa. La solicitud de enlace mantiene
elegibilidad, emision y auditoria en una transaccion protegida por ese bloqueo.
No se reintenta automaticamente un envio de correo externo.

Si la correccion gana, el enlace anterior se rechaza. Si la recuperacion gana,
la correccion posterior revoca sus efectos de acceso: correo nuevo, usuario y
asociado inactivos, cambio de clave obligatorio y sin tokens del correo anterior.
No se desactivan controles ni se suprimen errores de base de datos.

Regresion: IdentityEmailConcurrencyTest y su worker ejecutan cuatro carreras
reales en ambos ordenes (corregir/restablecer y corregir/solicitar enlace).
Una barrera mantiene el bloqueo y se comprueba una espera efectiva en InnoDB.
Los workers solo admiten APP_ENV=testing y la base aislada fonasin_test; no
imprimen claves, tokens, correos ni contenido de excepciones.

## Ficha que reaparecia despues de Ver todos

Las consultas por fila no compartian el control de respuestas tardias de la
busqueda por cedula. Ahora ambas usan la misma generacion de consulta de ficha.
Ver todos invalida las pendientes antes de cerrar la ficha y volver al listado.
Tambien se descartan errores tardios y se limpia el estado al cerrar sesion.
Tres regresiones de interfaz resuelven/rechazan promesas despues del cierre y
comprueban que no reaparecen ni ficha ni error antiguo.

## Plazos por rol

ResolvePasswordLinkLifetime es reutilizado al emitir y validar los enlaces y
al indicar su vigencia en los correos/auditoria existentes. Los asociados sin
roles administrativos usan auth.passwords.users.expire=1440; administradores,
revisores y cuentas sin rol usan staff_expire=120. El limite comun de 1440 se
conserva como retencion maxima del almacen compartido, evitando que la limpieza
generica de tokens elimine anticipadamente enlaces de asociados.

El plazo se mide desde la emision y se valida segun el rol actual. Los enlaces
internos pendientes de mas de dos horas dejan de aceptarse al aplicar esta regla;
si hace falta, se reenvian. No se restauran tokens consumidos/revocados. No cambian
sesiones, permisos ni el plazo independiente de los enlaces privados de PDF.

## Verificacion local

- MariaDB completa: 610 pruebas, 3912 aserciones correctas, incluidas cuatro
  carreras con procesos independientes y espera real de bloqueo InnoDB.
- SQLite completa: 610 casos, 3734 aserciones, sin fallos; 33 omitidos porque
  requieren MariaDB, incluidas las nuevas cuatro carreras.
- Frontend completo: 185 pruebas correctas y compilacion TypeScript/Vite.
- Plazos probados justo antes y en el limite de 24/2 horas para asociado,
  administrador, revisor, roles mixtos y cuenta sin rol; los correos coinciden.
- Tres regresiones de ficha prueban respuesta tardia, error tardio y busqueda
  pendiente despues de Ver todos. Se descartan sin reabrir ni mostrar error viejo.

No se usan datos reales ni se ejecutan pruebas contra produccion. El CI remoto
se consulta para el commit publicado; su resultado no se presume por estas pruebas.

## Entrega

Sin nuevas dependencias ni migraciones. Publicar backend y frontend juntos desde
el commit aprobado de main y regenerar config:cache por el procedimiento de Diego.
No se altera produccion durante la validacion local. Estas pruebas no sustituyen
la aceptacion funcional de FONASIN.
