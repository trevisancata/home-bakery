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
- [Supabase](https://supabase.com) (Postgres, Storage) para el catálogo, los workshops y las inscripciones
- [Zod](https://zod.dev) para validar formularios y la API
- [Playwright](https://playwright.dev) para los tests e2e y de la API
- ESLint
- GitHub Actions para CI (lint y build en cada PR)

## Páginas

| Ruta         | Contenido                                                  |
| ------------ | ---------------------------------------------------------- |
| `/`          | Inicio: destacados, workshops, Maggie y pedidos            |
| `/tienda`    | Productos por categoría (filtro en la URL: `?categoria=`)  |
| `/tienda/[slug]` | Detalle de un producto                                 |
| `/workshops` | Próximas fechas y cómo funcionan                           |
| `/workshops/[slug]/inscripcion` | Inscripción a un workshop               |
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

## Supabase

El catálogo, los workshops y las inscripciones se leen de Supabase. El modelo de datos, las políticas RLS y por qué la inscripción va por una función están en [docs/modelo-de-datos.md](docs/modelo-de-datos.md).

### Configuración (una sola vez)

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, correr [`supabase/migrations/0001_catalogo.sql`](supabase/migrations/0001_catalogo.sql). Crea las tablas, RLS, la vista `workshops_publicos`, la función `crear_inscripcion` y los buckets `productos` y `workshops`.
3. Copiar `.env.example` a `.env.local` y completarlo con los datos de **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: la URL del proyecto.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: la clave publishable (`sb_publishable_…`). Es pública y respeta RLS.
   - `SUPABASE_SECRET_KEY`: la clave secret (`sb_secret_…`). Se saltea RLS: solo para el seed y los tests. **Nunca** va en el código ni en Vercel.
   - `CATALOGO_FOTOS_DIR`: la carpeta del catálogo de Maggie (la que tiene `fotos/` adentro).
4. Cargar el catálogo:

   ```bash
   npm run seed
   ```

   Lee `supabase/seed/catalogo.json`, sube las 198 fotos al bucket `productos` y hace upsert por slug. Se puede correr las veces que haga falta: deja la base igual. Los productos con `activo: false` quedan cargados pero ocultos. Los workshops salen de `data/workshops.ts` y se marcan como de ejemplo (no aceptan inscripciones) hasta que Maggie pase los reales.

5. Para el deploy y la CI, cargar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como variables de entorno en Vercel y como *secrets* del repositorio en GitHub (**Settings → Secrets and variables → Actions**). El build prerenderiza el catálogo leyendo Supabase.

### API interna

Todas las respuestas son `{ data }` si salieron bien o `{ error: { message, fields?, spotsLeft? } }` si no. Las lecturas se cachean 5 minutos en la CDN.

| Método y ruta | Qué devuelve |
|---|---|
| `GET /api/categorias` | Categorías activas, en orden |
| `GET /api/productos?categoria=&destacados=` | Productos activos. 400 si la categoría no existe o los parámetros no son válidos |
| `GET /api/productos/[slug]` | Un producto. 404 si no existe o está oculto |
| `GET /api/workshops` | Próximos workshops, con lugares libres |
| `POST /api/inscripciones` | Crea una inscripción con `crear_inscripcion`: 201, 400, 404 o 409 (con `spotsLeft`) |

## Cómo correrlo en local

Requisitos: **Node.js 22.18 o superior** (recomendado: la versión LTS actual), npm y un proyecto de Supabase configurado (ver arriba).

```bash
# 1. Clonar el repositorio
git clone https://github.com/trevisancata/home-bakery.git
cd home-bakery

# 2. Instalar dependencias
npm install

# 3. Configurar Supabase (ver "Supabase") y cargar el catálogo
cp .env.example .env.local   # y completarlo
npm run seed

# 4. Levantar el servidor de desarrollo
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
| `npm run seed`  | Carga el catálogo y los workshops en Supabase |
| `npm run test:e2e` | Tests e2e y de la API con Playwright (build de producción) |
| `npm run compare` | Compara el sitio con el mockup              |

Los tests leen y escriben el proyecto de Supabase de `.env.local` sin ensuciar los datos reales: cada test que inscribe crea su propio workshop de prueba (slug `e2e-…`) y lo borra al terminar, con sus inscripciones. Al final de la corrida, un teardown borra cualquier `e2e-…` que haya quedado.
