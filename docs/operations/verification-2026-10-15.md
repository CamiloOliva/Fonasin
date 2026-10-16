# Cierre local de ajustes de entrega - 2026-10-15 / 2026-10-16

Rama: develop. Base: 7050680. Evidencia sobre el arbol de trabajo modificado,
no sobre un commit publicado ni una corrida de CI. Sin cambios en cPanel.

## Hallazgos corregidos

1. Porcentajes numericos de Excel: se conserva la unidad del formato porcentual;
   no se adivina por la magnitud. Plazo, NA y mv se importan independientemente.
2. Correccion de afiliacion: motivo cifrado, correo privado con vencimiento,
   edicion y reenvio de la misma solicitud, historial y autorizacion del dueno.
3. Cartera fuera de DECIMAL(14,2): validacion antes de persistir; errores
   inesperados revierten los creditos y cierran el lote sin filtrar SQL.
4. Convenios: cambiar el logo no cambia la ruta historica publicada.
5. Portal: la tasa mensual se muestra aunque no exista tasa anual. Las tasas
   historicas sin unidad conocida no se reclasifican automaticamente.

La revision de seguridad adicional cerro el uso de una autorizacion empresarial
anterior para aprobar valores corregidos: se archiva al devolver o regenerar,
sin borrar su archivo. Las escrituras y decisiones bloquean la misma solicitud.
Reanudar desde el portal consulta el backend y conserva el trabajo guardado.

Se conservan los ajustes de esta entrega: condiciones completas administrables
de convenios, referencia y nombres en solicitudes, saldo total, datos financieros
y ciudades del formulario, visor legal y ajustes del PDF de ahorro voluntario.
Ver ADR-007 y la matriz de trazabilidad para las decisiones y limites.

## Resultados ejecutados

### Seguimiento de los cuatro hallazgos de la ultima reauditoria

- Una cuenta inactiva pierde tambien su sesion ya abierta. El middleware web
  invalida sesion/recuerdo, renueva CSRF y audita el cierre antes de denegar.
  Se cubren seis peticiones por rol/operacion y el control de acceso valido.
- Symfony HTTP Foundation pasa a 7.4.21. Las pruebas comprueban conservacion de
  Cache-Control ante espacios y el separador por espacios. YAML tambien pasa
  a 7.4.21 al ampliar la auditoria a dependencias PHP de desarrollo; CI consulta
  todo el conjunto PHP. No se ignoran avisos ni se actualiza Laravel.
- El panel elimina Reactivar sobre creditos pagados. Conserva marcar pagado
  sobre activos y archivar activos/pagados; no cambia la maquina de estados.
- Selector, validacion HTTP y caso de uso aceptan solamente PDF empresarial
  hasta 5 MB. Imagenes, imagen renombrada y exceso de tamano se rechazan antes
  de registrar documentos. La carga PDF valida conserva su control positivo.

La repeticion encontro tambien un defecto del test de concurrencia: asumian
que cada senal de stdout llegaba en un unico fragmento. El lector ahora acumula
solo stdout; tres pruebas fijan todos los cortes posibles de CHECKED, WAITING
y LOCKED, ignoran stderr y rechazan salida ajena. Se comprueba la escritura de
la senal de liberacion y se refresca stat en el worker. Se conservan el timeout,
la espera SQL real y las aserciones de saldo, registros y archivo unico.
Las dos carreras pasaron tres corridas aisladas consecutivas despues del ajuste.

| Verificacion | Resultado |
| --- | --- |
| Backend SQLite | 356 pasan; 26 omisiones especificas de MariaDB; 1950 aserciones |
| Backend MariaDB 10.11 local | 382 pasan; 0 omisiones; 2023 aserciones |
| Frontend Vitest | 18 archivos; 77 pruebas pasan; Node 24.19.0 |
| Navegador Edge + Laravel + MariaDB | 3 recorridos pasan; sin mocks de HTTP/DB |
| Contrato visual Edge a 1440/390 px | 2 pruebas pasan, incluidos fecha y selector deshabilitado |
| Comparacion con Tailwind 3 | 14 capturas comparadas; 0 elementos diferentes dentro de las tolerancias descritas |
| npm ci desde lockfile final | Pasa; 179 paquetes instalados; auditoria completa en cero |
| Refuerzo del recorrido de correccion | Pasa; ambos PDF renderizan pagina visible |
| Build TypeScript/Vite con URL productiva | Pasa; aviso de chunks mayores de 500 kB |
| Pint sobre cambios PHP | Pasa |
| git diff --check | Pasa |
| Composer audit completo y productivo | Sin alertas |
| npm audit completo | Sin vulnerabilidades reportadas, incluido desarrollo |
| Workflow YAML / lockfiles | Sintaxis y validacion correctas |

Las suites backend se ejecutaron en serie. Los intentos simultaneos que
compartian Storage::fake fueron descartados. Vitest se ejecuto con threads y
un worker en este entorno Windows. Las carreras de importacion se comprobaron
contra MariaDB con procesos separados y una espera de bloqueo observada.
La corrida final usa los dos paquetes Symfony ya actualizados. Los intentos
de concurrencia anteriores con timeout no se cuentan como evidencia de cierre.
La instalacion limpia detecto dos entradas empaquetadas faltantes de emnapi
en el lockfile; se recuperaron de una resolucion aislada sin actualizar el
resto de dependencias. npm ci se repitio con exito, seguido por las 77 pruebas
React, build, auditorias completas/productivas y ambos recorridos del otrosi
(70.94 s y 20.95 s). El control visual permanente paso sus dos casos.
El primer intento posterior a npm ci encontro la cache de optimizacion de
Vite sin responder al modulo de entrada; se reinicio con --force y se repitio.
Ese intento fallido no se cuenta como aprobacion. Las fuentes externas se
bloquean en el control de tokens, no en el recorrido funcional del otrosi.
En navegador se conceden 60 segundos solo a la navegacion inicial de cada rol
por la carga fria de Vite; no se amplia el timeout de sus aserciones de negocio.

El navegador comprueba los cuatro roles, cuatro importaciones, valores y tasas,
saldo total, rechazo/reintento, autorizacion empresarial y coexistencia de
solicitudes; propietario ajeno bloqueado y revisor sin acciones de decision.
Comprueba contenido publico administrado, PDF, ruta de convenio y portal movil
sin desbordamiento horizontal. El segundo recorrido corrige y reenvia una
afiliacion desde el enlace del correo, sin cambiar su identificador.

## Preparacion y limites de la evidencia

- Cuatro migraciones aditivas: tasa anual, condiciones, unidad de tasa/ruta de
  convenio y registro de correcciones. Aplicadas en MariaDB local de pruebas.
- Fixtures sinteticos, credenciales y capturas bajo .e2e-artifacts, ignorado
  por Git. Ni dist ni esos datos forman parte del codigo a confirmar.
- No se envio correo real: el transporte SMTP del entorno final queda fuera
  de estas pruebas. Si el transporte falla, el flujo tiene regresion de rollback.
- Estas pruebas no son una certificacion general de seguridad ni aceptacion
  funcional contractual de FONASIN. Carlos y Bibian deben revisar la entrega.
- Las siete entradas transitivas del tooling Tailwind 3 se eliminaron con la
  migracion controlada a Tailwind 4.3.3 y su plugin Vite; ver ADR-008. No se
  ignoraron avisos ni se forzo un override incompatible. source-map-js queda
  en 1.2.2. La auditoria completa se consulta independientemente de produccion.
- No se ejecutaron migraciones productivas, push, merge a main ni despliegue.
  El build local no sustituye al artefacto del futuro commit aprobado.

## Cierre de cuatro hallazgos de seguridad - 2026-10-16

La auditoria adicional reprodujo: un token de recuperacion de 24 horas aceptado,
sesiones previas aun autorizadas despues de recuperar la clave, etiquetas de
formula interpretadas en la ficha XLSX y ausencia de limite en password/reset.
Las primeras regresiones dieron 15 fallas y 5 controles positivos antes del
arreglo; no se confundio ese resultado con una aprobacion.

Se corrigieron con vencimiento absoluto (60 minutos, limite exacto incluido),
bloqueo/consumo de un solo uso del token, rotacion del recuerdo, revocacion de
sesiones y AuthenticateSession vinculado desde el login. Se preservan sesiones
de otras cuentas. El limitador usa dos contadores HMAC independientes: cuenta
5/minuto e IP 10/minuto, con 429/Retry-After y recuperacion tras la ventana.
Datos malformados siguen siendo errores de validacion, no excepciones del gate.
El exportador usa texto literal del generador para valores, campos y categorias;
conserva numeros, booleanos y proteccion previa de prefijos de formula.

Se agregan 26 casos PHP contando data providers y el refuerzo del lector de
procesos. La tabla superior contiene las suites completas finales. React vuelve
a pasar sus 77 pruebas y el build con URL productiva pasa; conserva solamente
el aviso ya documentado de tamano de chunks. No se agregan dependencias ni
migraciones. Las auditorias completas de npm y Composer siguen en cero.

La repeticion de MariaDB encontro otro fallo del arnes de concurrencia:
waitUntil podia consumir stdout en updateStatus antes de instalar el callback.
Se reprodujo con BUFFER=READY y OLD_WAIT=false. La espera ahora inspecciona el
buffer completo; tres controles usan procesos reales, salida ya recibida,
fragmentos, stderr y finalizacion sin senal. No se ampliaron los tiempos ni se
retiraron las aserciones SQL. Los ocho casos focalizados pasaron y luego la
suite MariaDB completa paso 382/382. Las dos fallas previas quedan descartadas
como evidencia de cierre, no ocultadas ni convertidas en omisiones.

El recorrido nuevo de seguridad pasa con dos contextos independientes de
navegador autenticados antes de recuperar la clave desde un tercero. Ambos
pierden acceso a auth/user y al panel (401), una cuenta ajena conserva acceso
y un ingreso nuevo acepta la nueva clave. Un enlace de 24 horas recibe 422 y
el navegador de recuperacion no queda autenticado automaticamente.
Resultados finales de navegador: seguridad 35.76 s, otrosi 89.94 s y correccion
de afiliacion 21.44 s, tres pasan. Los fixtures son sinteticos y quedan ignorados
por Git. Tras la pausa se reinicio Laravel local antes de medir; ningun dato
de produccion intervino. La revision de cPanel/TLS/cookies sigue fuera de esta
evidencia. No se hizo push, merge ni despliegue.

## Comparacion visual de la migracion CSS

Se registraron antes de cambiar el compilador siete vistas locales a 1440 y
390 px: inicio, productos, creditos, convenio, afiliacion, asociado y admin.
Las 14 comparaciones finales dan cero elementos diferentes en las propiedades
y geometria medidas; conservan capturas antes/despues en el directorio ignorado
.e2e-artifacts/styles. Se mantienen los mismos fixtures sinteticos durante
la comparacion, sin reseed entre referencia y resultado.

El comparador no es una prueba pixel-perfect: normaliza serializaciones de
color, capas de sombra sin extension e interpolacion equivalente de gradientes.
Permite hasta 0.5 px de geometria y un paso de color premultiplicado de 8 bits.
No compara cada pseudo-elemento, estado hover, pantalla o motor de navegador.
Bloquea recursos externos y video para evitar una referencia no determinista;
no afirma validar esos recursos. Espera los estados de carga del portal.

El control permanente test:theme comprueba marca, sombras, espacios, tipografia,
placeholder, fecha y selector deshabilitado en escritorio/movil. Vitest impide
usar utilidades legacy sin definicion. Dos pruebas PHP fijan los comandos de
auditoria completa en CI. Cambiar una clase de compatibilidad exige repetir
estos controles; no basta con que el build no falle.
