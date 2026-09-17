# ADR-003: MariaDB como base de datos de produccion

**Estado:** aceptada

## Contexto

El hosting cPanel confirmado para FONASIN no dispone de PostgreSQL y ofrece MariaDB. La plataforma necesita conservar UUID, relaciones, transacciones, restricciones financieras, unicidad de borradores, auditoria e importaciones sin rebajar las garantias del modelo.

## Decision

Usar MariaDB 10.11 LTS o superior como unica fuente de verdad operativa. Laravel utiliza la conexion `mariadb`, `utf8mb4`, modo estricto y UTC en la aplicacion. Las migraciones implementan restricciones `CHECK` y un indice unico sobre una columna generada para garantizar un solo borrador activo por asociado.

SQLite se mantiene unicamente para pruebas rapidas. El quality gate de produccion ejecuta una instalacion limpia y toda la suite contra MariaDB 10.11. PostgreSQL deja de ser requisito de despliegue.

## Consecuencias

- cPanel debe confirmar MariaDB 10.11 o superior y la extension PHP `pdo_mysql`.
- Los campos estructurados se materializan como JSON compatible con MariaDB.
- Las fechas se escriben y leen en UTC desde Laravel porque MariaDB no conserva una zona horaria por valor.
- Los respaldos y procedimientos operativos usan herramientas compatibles con MariaDB.
- Cualquier cambio futuro de esquema debe superar las suites SQLite y MariaDB.
