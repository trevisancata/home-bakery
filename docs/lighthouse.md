# Lighthouse

Puntajes de Accessibility, Best Practices y SEO en mobile. El mínimo aceptado es 90 en cada categoría.

## Última medición

- **Fecha:** 29/09/2026
- **Commit:** `65eb1f9` (rama `feat/workshops-maggie`)
- **Lighthouse:** 12.8.2, emulación mobile, Chromium de Playwright (headless)
- **Servidor:** build de producción (`npm run build && npm start`)

| Ruta | Accessibility | Best Practices | SEO |
|---|---|---|---|
| `/` | 100 | 100 | 100 |
| `/tienda` | 100 | 100 | 100 |
| `/workshops` | 100 | 100 | 100 |
| `/maggie` | 100 | 100 | 100 |

No hubo que corregir nada: ninguna auditoría automática falló. Lighthouse no cubre todo: las pruebas manuales de accesibilidad (teclado, lector de pantalla, zoom) siguen haciendo falta.

## Cómo repetirlo

```sh
npm run build && npm start
```

En otra terminal, para cada ruta (`/`, `/tienda`, `/workshops`, `/maggie`):

```sh
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
npx lighthouse@12 http://localhost:3000/workshops \
  --only-categories=accessibility,best-practices,seo \
  --form-factor=mobile --chrome-flags="--headless=new" --view
```

`CHROME_PATH` usa el Chromium que instala `npx playwright install chromium`. Con Google Chrome instalado se puede omitir.
