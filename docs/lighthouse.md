# Lighthouse

Puntajes de Accessibility, Best Practices y SEO en mobile. El mínimo aceptado es 95 en Accessibility y SEO, y 90 en Best Practices.

## Panel de Maggie (E5)

- **Fecha:** 22/10/2026
- **Rama:** `feat/e5-panel-admin`
- **Lighthouse:** 12.8.2, mobile y desktop
- **Sesión:** usuaria admin temporal, borrada después de medir

| Ruta | Accessibility | Best Practices |
|---|---|---|
| `/admin` | 100 | 100 |
| `/admin/productos` | 100 | 100 |
| `/admin/productos/[id]` (editor) | 100 | 100 |
| `/admin/productos/nuevo` | 100 | 100 |
| `/admin/workshops` | 100 | 100 |
| `/admin/workshops/[id]` | 100 | 100 |
| `/admin/inscripciones` | 100 | 100 |

La SEO no se mide porque el panel lleva `noindex` a propósito.

**Corrección a partir de la medición:** en desktop, Best Practices daba 96 por `image-aspect-ratio`. Era el logo de la barra mobile oculta: next/image lo pedía a 96×90, con una relación apenas distinta de la del original. Pasó a un `<img>` común con las medidas reales del PNG (24 KB). El resto se midió antes del cambio, y `/admin/productos`, el editor y `/admin/inscripciones` se volvieron a medir después: 100 y 100.

## Pago de la seña (E6)

- **Fecha:** 21/10/2026
- **Rama:** `feat/e6-mercadopago-sena`
- **Lighthouse:** 12.8.2, mobile y desktop
- **Servidor:** build de producción, con el mock de Mercado Pago de los e2e

| Ruta | Accessibility | Best Practices | SEO |
|---|---|---|---|
| Resultado: reservada | 100 | 100 | 63* |
| Resultado: pendiente | 100 | 100 | 63* |
| Resultado: rechazada | 100 | 100 | 63* |
| Paso "Revisá y dejá la seña" | axe-core: 0 violaciones | — | — |

\* La página de resultado lleva `noindex` a propósito, porque es de cada inscripción. La única auditoría de SEO que falla es `is-crawlable`.

El paso de la seña es un estado del formulario: Lighthouse no puede llegar hasta ahí. Se revisó con axe-core 4.10 (WCAG 2.2 AA) en mobile y en desktop, igual que las tres páginas de resultado: 0 violaciones.

## Panel de administración (E5)

- **Fecha:** 21/10/2026
- **Rama:** `feat/e5-auth-admin-api`
- **Lighthouse:** 12.8.2, Chromium de Playwright (headless), mobile y desktop
- **Servidor:** build de producción (`npm run build && npm start`)

| Ruta | Accessibility | Best Practices | SEO |
|---|---|---|---|
| `/admin/ingresar` (mobile y desktop) | 100 | 100 | 63* |
| `/admin/recuperar?error=link` (mobile y desktop) | 100 | 100 | 63* |
| 403 "No tenés permiso" | axe-core: 0 violaciones | — | — |

\* El panel lleva `noindex` a propósito, y la única auditoría de SEO que falla es `is-crawlable`.

La 403 responde con status 403, y Lighthouse no audita páginas con status de error. Se revisó con axe-core 4.10 (el motor de accesibilidad de Lighthouse), con reglas WCAG 2.2 AA y buenas prácticas, en mobile y en desktop, con la sesión de una usuaria temporal sin rol.

Correcciones a partir de la medición:
- El logo del login pedía la imagen de 80 px y se mostraba a 156 (`image-size-responsive`): `Logo` acepta `sizes`.
- El panel del logo quedaba fuera de los landmarks (axe: `region`): pasó a `<header>`.

## Sitio público: última medición

- **Fecha:** 05/10/2026
- **Commit:** `8a46b70` (rama `feat/e4-supabase-catalogo`)
- **Lighthouse:** 12.8.2, emulación mobile, Chromium de Playwright (headless)
- **Servidor:** build de producción (`npm run build && npm start`) leyendo Supabase

| Ruta | Accessibility | Best Practices | SEO |
|---|---|---|---|
| `/` | 100 | 100 | 100 |
| `/tienda` | 100 | 100 | 100 |
| `/tienda/number-cake` | 100 | 100 | 100 |
| `/workshops` | 100 | 100 | 100 |

`/maggie` no cambió en este PR y no se volvió a medir (100 / 100 / 100 el 04/10).

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
