# FONASIN — Plataforma institucional

Frontend actual en React + TypeScript + Vite + Tailwind CSS. El proyecto se prepara para evolucionar a un monolito modular en Laravel, React/Inertia, Filament y PostgreSQL, sin interrumpir el sitio actual.

## Requisitos
- Node.js 20+
- npm

## Ejecutar
```bash
npm install
npm run dev
```

## Verificar producción
```bash
npm run build
npm run preview
```

## Personalización rápida
- Colores: `tailwind.config.js`
- WhatsApp: `src/data/siteConfig.ts` o `VITE_WHATSAPP_URL`
- Navegación: `src/data/navigation.ts`
- Flyers: `src/data/flyers.ts`
- Convenios: `src/data/convenios.ts`
- Historia: `src/data/history.ts`
- Productos: `src/data/products.ts`
- Documentos: `src/data/documents.ts`
- Imágenes: `src/assets/images/`

> El contenido marcado como provisional/placeholder debe sustituirse por información oficial de FONASIN antes de producción.

## Arquitectura y desarrollo

- [Documentacion tecnica](docs/README.md)
- [Arquitectura objetivo](docs/architecture/overview.md)
- [Modelo de datos](docs/architecture/data-model.md)
- [Desarrollo local y ramas](docs/operations/local-development.md)
- [Preparacion de cPanel](infra/cpanel/README.md)
