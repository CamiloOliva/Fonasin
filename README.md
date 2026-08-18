# FONASIN — Frontend institucional

Frontend en React + TypeScript + Vite + Tailwind CSS. Está organizado para que el contenido editable viva en `src/data/` y la futura integración con Laravel pueda concentrarse en `src/services/`.

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
