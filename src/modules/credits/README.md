# Modulo Credits

Este modulo es propietario de la presentacion y, en fases posteriores, de los casos de uso relacionados con lineas, saldos, cuotas, tasas e importacion administrativa de creditos.

## Estado actual

- `pages/CreditsPage.tsx` presenta informacion publica y provisional sobre lineas de credito.
- No consulta saldos, personas ni datos privados.
- La consulta de creditos del asociado se implementara cuando existan autenticacion, autorizacion y contratos Backend aprobados.

## Limites

- No autentica usuarios: eso pertenece a `identity`.
- No decide que asociado puede ver un credito: la identidad de sesion y las policies del Backend lo determinan.
- No administra contenido institucional general.
- No persiste datos en el navegador.

Toda pantalla privada futura debe incluir estados de carga, vacio, error, sesion vencida y sin permiso.
