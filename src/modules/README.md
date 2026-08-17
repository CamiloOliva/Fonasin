# Modulos frontend

Los modulos objetivo son `public`, `identity`, `affiliation`, `credits`, `portal`, `fpqrs` y `content`.

```text
src/modules/<modulo>/
  pages/        # pantallas y composicion de la ruta
  components/   # componentes exclusivos del modulo
  services/     # acceso a contratos HTTP; nunca a PostgreSQL
  types/        # DTO y tipos de presentacion del modulo
```

Las pantallas existentes se mantienen temporalmente en `src/pages/` para evitar una reescritura innecesaria. Todo desarrollo nuevo debe ubicarse por modulo y, cuando se migre una pantalla existente, deben actualizarse sus importaciones y pruebas en el mismo cambio.

`credits` es el primer modulo migrado y sirve como referencia. No se deben mover pantallas de forma masiva: cada migracion debe conservar comportamiento, rutas y compilacion.
