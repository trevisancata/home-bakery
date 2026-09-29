# Home Bakery

Sitio web de **Home Bakery**, un emprendimiento de pastelería casera que vende productos artesanales y ofrece workshops para aprender a hacerlos en casa.

Es un trabajo práctico universitario. Se evalúan especialmente:

- HTML semántico
- Diseño responsive (mobile-first)
- Accesibilidad (WCAG AA)
- Consistencia visual

## Deploy

🔗 **Sitio publicado:** [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app)

## Stack

- [Next.js 16](https://nextjs.org) con App Router y Turbopack
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- ESLint
- GitHub Actions para CI (lint y build en cada PR)

## Páginas

| Ruta         | Contenido                                                  |
| ------------ | ---------------------------------------------------------- |
| `/`          | Inicio: destacados, workshops, Maggie y pedidos            |
| `/tienda`    | Productos por categoría                                    |
| `/workshops` | Próximas fechas y cómo funcionan                           |
| `/maggie`    | Historia, valores y la cocina                              |

Las rutas viejas `/productos`, `/nosotros` y `/contacto` redirigen (308) a `/tienda`, `/maggie` e `/`.
El contacto vive en el footer y en el botón flotante de WhatsApp.

## Sistema de diseño

- **Tokens** en `app/globals.css` (`@theme` de Tailwind v4): hueso, carbón, chocolate, taupe, caramelo,
  greige, arena y texto secundario. Caramelo y greige se usan solo para fondos y bordes (no llegan a AA como texto).
- **Tipografías** con `next/font/google`: Gilda Display (títulos), Mrs Saint Delafield (acento manuscrito),
  Oswald (etiquetas) y DM Sans (cuerpo y botones).
- **Componentes base** en `components/`: `Button`, `Eyebrow`, `SectionTitle` (prop `script` para la palabra
  manuscrita) e `ImageFrame` (imagen con placeholder de marca mientras no hay foto).
- **Contenido**: todos los datos del negocio y los textos están en `data/site.ts`. Los componentes no tienen
  textos escritos adentro.

## Cómo correrlo en local

Requisitos: **Node.js 20.9 o superior** (recomendado: la versión LTS actual) y npm.

```bash
# 1. Clonar el repositorio
git clone https://github.com/trevisancata/home-bakery.git
cd home-bakery

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

Después abrí [http://localhost:3000](http://localhost:3000) en el navegador.

### Otros scripts

| Comando         | Qué hace                                   |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Servidor de desarrollo con recarga en vivo |
| `npm run build` | Build de producción                        |
| `npm start`     | Sirve el build de producción               |
| `npm run lint`  | Revisa el código con ESLint                |
