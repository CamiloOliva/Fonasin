# Desarrollo y despliegue del frontend React

## Objetivo

El frontend actual es una SPA construida con React, TypeScript y Vite. En produccion Apache no ejecuta React ni Node.js: sirve el resultado estatico que Vite genera en `dist/`.

```text
Codigo fuente en src/
        -> npm ci
        -> npm run build
        -> dist/
        -> Apache sirve dist/ en el dominio principal
```

## Reglas de trabajo no negociables

1. Todo desarrollo React ocurre en `src/`. No editar archivos dentro de `dist/` ni `node_modules/`.
2. `dist/` es generado y esta ignorado por Git. No confirmarlo como solucion de despliegue.
3. Todo cambio de dependencias actualiza y confirma juntos `package.json` y `package-lock.json`.
4. Para instalar exactamente las dependencias bloqueadas usar `npm ci`. Usar `npm install` solo cuando se agregue o actualice una dependencia de forma deliberada.
5. Antes de mergear a `main`, ejecutar `npm run build`. El comando verifica TypeScript y genera el bundle de produccion.
6. No colocar secretos en variables `VITE_*`: todas quedan incorporadas en el JavaScript publicado y son visibles en el navegador.
7. No usar rutas absolutas del equipo, `localhost` ni credenciales en codigo publicado.

## Comandos locales

```bash
npm ci
npm run dev
npm run build
npm run test
npm run test:watch
npm run preview
```

Usar `npm run preview` para revisar el bundle creado, no solo el servidor de desarrollo. Una pagina que funciona con `npm run dev` puede fallar en produccion por rutas, variables de entorno o recursos ausentes.

## Estructura del frontend

```text
src/
  app/                 # punto de entrada, proveedores y composicion global
  routes/              # rutas actuales de React Router
  pages/               # pantallas existentes durante la transicion
  components/          # componentes visuales reutilizables
  data/                # contenido publico temporal y no sensible
  services/            # clientes para servicios futuros
  modules/             # destino de codigo nuevo organizado por dominio
  shared/              # tipos y utilidades realmente compartidos
public/                # archivos estaticos copiados sin transformacion al build
```

El codigo nuevo debe nacer en `src/modules/<modulo>/`. Las pantallas existentes se migran gradualmente, con sus rutas y pruebas, sin reescribirlas por apariencia.

## Rutas y Apache

React Router usa `BrowserRouter`. Al abrir directamente una ruta como `/mi-fondo` o actualizar `/portal-asociado`, Apache debe devolver `index.html`; sin este fallback respondera 404 aunque la navegacion interna funcione.

El archivo `public/.htaccess` se copia a `dist/.htaccess` durante el build y proporciona el fallback SPA. No eliminarlo ni convertirlo en una redireccion externa.

Antes de desplegar, comprobar que `/`, `/mi-fondo`, `/convenios`, `/portal-asociado` y una ruta inexistente funcionan al abrirlas o recargarlas directamente.

El hosting debe tener `mod_rewrite` y permitir `.htaccess` en el document root. Si no es asi, el proveedor debe configurar el fallback de Apache.

## Recursos y archivos estaticos

- Usar `public/` para archivos con URL publica estable, como imagenes institucionales o `.htaccess`.
- Usar `src/assets/` para recursos importados por componentes y procesados por Vite.
- No guardar documentos de afiliacion, archivos de usuarios ni datos privados en `public/`.
- Verificar mayusculas/minusculas de nombres: Linux distingue `Logo.svg` de `logo.svg`.
- Optimizar imagenes antes de incorporarlas; no subir archivos enormes sin necesidad.

## Variables de entorno

```text
.env
VITE_API_BASE_URL=
VITE_WHATSAPP_URL=
```

- `.env` nunca se sube a Git.
- Solo publicar con `VITE_*` valores seguros para cualquier visitante.
- En produccion, `VITE_API_BASE_URL` debe usar HTTPS y el dominio aprobado.
- Cuando exista Laravel, los secretos permanecen en el `.env` del backend y nunca pasan al build React.

## Flujo de version y publicacion

```text
feature/*
  -> develop (trabajo e integracion local)
  -> revision y merge de Diego
  -> main
  -> build del commit exacto
  -> copia de dist/ al document root Apache
```

Solo `main` se publica. No copiar un build de `develop` sobre el dominio principal. La automatizacion futura construye desde el commit de `main`, nunca desde una carpeta `dist/` preexistente, y copia el contenido de `dist/`, incluidos `.htaccess` y `assets/`.

## Lista de salida obligatoria

- [ ] `npm ci` termina sin errores.
- [ ] `npm run test` termina sin errores.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run preview` permite navegar las rutas criticas.
- [ ] No hay secretos, URLs locales ni credenciales en el bundle.
- [ ] Las rutas directas funcionan con Apache y `.htaccess`.
- [ ] `git diff --check` no reporta problemas.
- [ ] Documentacion actualizada cuando cambia una ruta, variable, dependencia o comportamiento de despliegue.

El workflow central `.github/workflows/quality-gates.yml` valida Frontend, Backend y los artefactos requeridos por Apache en cada push y Pull Request.
