# ADR-008 - Actualizacion de seguridad del compilador CSS

Fecha: 2026-10-15. Estado: implementado; no cambia el alcance funcional.

## Motivo y decision

La auditoria completa de npm detectaba siete entradas transitivas en el
tooling de Tailwind 3, relacionadas con braces y postcss-selector-parser.
Se migra deliberadamente a Tailwind 4.3.3 y su plugin oficial de Vite, sin
`audit fix --force`, supresiones ni overrides de APIs incompatibles.
Se retiran la configuracion PostCSS y Tailwind 3 y autoprefixer; Vite conserva
su motor PostCSS. El lockfile fija el conjunto reproducible.

## Conservacion de la interfaz

- `src/styles/tailwind-compat.css` mantiene la paleta HEX, tipografias,
  sombras y escalas de la interfaz anterior, con su aviso de licencia MIT.
- Las utilidades `legacy-space-*` conservan el margen del hermano siguiente;
  `legacy-bg-gradient-to-*` conserva la interpolacion RGB anterior.
- El reset existente usa la capa base; se preservan placeholder, controles
  deshabilitados, fechas, padding de tablas y cascada de interlineado.
- Se retiran clases que Tailwind 3 no generaba y que el nuevo compilador
  empezaria a activar. No se introduce con ello un rediseno.
- Las fuentes del compilador se limitan expresamente a src/ e index.html;
  no se escanean dependencias PHP, documentos ni artefactos de pruebas.
- Vitest comprueba que toda utilidad legacy usada tenga definicion. El
  navegador comprueba colores, espacios, controles y responsive a 1440/390px.

## Ejecucion y limites

Node debe cumplir engines de package.json; la validacion local usa 24.19.0.
CI ejecuta la auditoria npm completa y bloquea desde severidad low. Composer
tambien audita herramientas de desarrollo; dos regresiones fijan ese contrato.

Tailwind 4 requiere navegadores modernos: Safari 16.4+, Chrome 111+ y
Firefox 128+. Esta entrega verifica Edge/Chromium; no afirma haber probado
Safari, Firefox ni navegadores anteriores. Si el cliente requiere soporte
anterior, debe revisarse antes de publicar; no se oculta este cambio de base.

Guia oficial: https://tailwindcss.com/docs/upgrade-guide.
La evidencia concreta y sus limites estan en operations/verification-2026-10-15.md.
