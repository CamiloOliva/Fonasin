# Limites de modulos

## Proposito

Evitar que el crecimiento del proyecto convierta el codigo en una sola capa de dependencias cruzadas. Cada modulo es responsable de sus datos, sus reglas y sus casos de uso.

## Mapa de responsabilidades

| Modulo | Entrada principal | Datos propietarios | Salidas permitidas |
|---|---|---|---|
| Identity | login, recuperacion, administracion de usuarios | `users`, `roles`, `role_user`, `auth_events` | identidad autenticada y permisos |
| Affiliation | formulario por etapas y revision | solicitudes, secciones, documentos, consentimientos | estado de solicitud y evento de aprobacion/rechazo |
| Credits | carga administrativa y consulta privada | creditos y su historial | resumen autorizado para Portal |
| Portal | sesion de asociado | no es propietario de datos financieros | vistas del asociado autenticado |
| Content | administracion limitada | carrusel y convenios | contenido publico publicado |
| FPQRS | formulario publico | entrega y estado interno minimo | confirmacion de envio |

## Comunicacion permitida

```text
Portal -> Application/Credits -> Credits
Affiliation -> Application/Identity -> Identity
Affiliation -> Application/Audit -> Audit
Content -> Application/Audit -> Audit
```

Un modulo puede solicitar una accion mediante un caso de uso o reaccionar a un evento de dominio. No puede:

- modificar directamente una tabla de otro modulo;
- importar clases internas de infraestructura de otro modulo;
- duplicar reglas de validacion o autorizacion;
- usar la UI como fuente de verdad de un estado de negocio.

## Ejemplos

**Correcto:** al aprobar una afiliacion, `Affiliation` emite un evento y un caso de uso de `Identity` puede crear o activar la cuenta del asociado si esa regla fue aprobada.

**Incorrecto:** un controlador del portal ejecuta SQL para cambiar `affiliation_applications.status`.

**Correcto:** `Portal` solicita `ViewAssociateCredits` con el usuario autenticado; el caso de uso verifica la relacion usuario-asociado antes de devolver datos.

**Incorrecto:** el navegador envia un `associate_id` y el backend confia en ese valor sin una policy.

## Dependencias por capa

```text
resources/js y Filament
        ↓
HTTP: rutas, middleware, requests, controllers
        ↓
Application: casos de uso, DTOs, transacciones
        ↓
Domain: entidades, reglas, estados, eventos
        ↓
Infrastructure: PostgreSQL, storage, correo, auditoria
```

La flecha no se invierte. Dominio no conoce React, Filament, Request, Eloquent, cPanel ni proveedores de almacenamiento.
