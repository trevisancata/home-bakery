# Lighthouse

Puntajes de Accessibility, Best Practices y SEO en mobile. El mínimo aceptado es 95 en Accessibility y S## Última medición

- **Fecha:** 04/10/2026
- **Commit:** `9e61c2d` (rama `feat/contenido-maggie-v6`)
- **Lighthouse:** 12.8.2, emulación mobile, Chromium de Playwright (headless)
- **Servidor:** build de producción (`npm run build && npm start`)

| Ruta | Accessibility | Best Practices | SEO |
|---|---|---|---|
| `/` | 100 | 100 | 100 |
| `/workshops` | 100 | 100 | 100 |
| `/maggie` | 100 | 100 | 100 |

`/tienda` no cambió en este PR y no se volvió a medir (100 / 100 / 100 el 29/09).

No hubo que corregir nada: ninguna auditoría automática falló. Lighthouse no cubre todo: las pruebas manuales de accesibilidad (teclado, lector de pantalla, zoom) siguen haciendo falta.

### Contraste del texto sobre las portadas

Lighthouse mide el contraste contra el color de fondo del CSS, no contra la foto o el video, así que las portadas con capa oscura (carrusel del inicio y portada de `/workshops`) se midieron aparte, en el peor caso: la diapositiva pintada de blanco puro. Se toma el píxel más claro detrás de cada texto y se compara con el color del texto.

| Texto | Tamaño | Inicio 1440 | Inicio 390 | /workshops 1440 | /workshops 390 |
|---|---|---|---|---|---|
| Eyebrow (crema) | 14 px | 6.29:1 | 4.72:1 | 6.53:1 | 5.10:1 |
| Título (hueso) | 84-92 / 48 px | 7.21:1 | 6.37:1 | 5.80:1 | 6.70:1 |
| Palabra manuscrita (crema) | 147-161 / 84 px | 6.13:1 | 5.34:1 | 6.42:1 | 5.69:1 |
| Bajada (hueso) | 20 / 16 px | 7.56:1 | 6.57:1 | 7.45:1 | 6.99:1 |

Con la capa pareja del mockup (`capa` al 42%) sola, la bajada daba ~2.9:1 sobre blanco. Se sumó un degradé de `capa` debajo del bloque de texto (hacia arriba en mobile y hacia la derecha en desktop). El primer ajuste dejaba el eyebrow de desktop en 3.77:1 y se reforzó hasta pasar 4.5:1. Todo el texto llega a AA (4.5:1) aunque la foto sea blanca.

oom) siguen haciendo falta.

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
