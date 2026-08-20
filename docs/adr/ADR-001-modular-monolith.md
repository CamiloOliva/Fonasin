# ADR-001: Monolito modular

**Estado:** aceptada

## Contexto

FONASIN requiere sitio institucional, afiliacion, portal, creditos y administracion. El despliegue inicial sera en cPanel y el equipo necesita una operacion simple.

## Decision

Usar Laravel como aplicacion unica, React/Inertia para interfaz y Filament para administracion. Organizar el codigo por modulos de dominio.

## Consecuencias

- Se reduce complejidad de despliegue, autenticacion y configuracion.
- Los modulos se desacoplan mediante casos de uso, politicas y eventos, no mediante servicios separados prematuros.
- Una futura API o servicio independiente reutilizara las reglas de dominio existentes.
