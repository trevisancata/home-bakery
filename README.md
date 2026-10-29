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
- [Supabase](https://supabase.com) (Postgres, Storage, Auth) para el catálogo, los workshops, las inscripciones y el login del panel
- [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) para la sesión en cookies HttpOnly, y [sharp](https://sharp.pixelplumbing.com) para validar las fotos que se suben
- [Zod](https://zod.dev) para validar formularios y la API
- [Mercado Pago Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/overview) con el [SDK oficial](https://github.com/mercadopago/sdk-nodejs) para el pago de los workshops
- [Playwright](https://playwright.dev) para los tests e2e y de la API
- ESLint
- GitHub Actions para CI (lint y build en cada PR)

## Páginas

| Ruta         | Contenido                                                  |
| ------------ | ---------------------------------------------------------- |
| `/`          | Inicio: destacados, workshops, Maggie y pedidos            |
| `/tienda`    | Productos por categoría (filtro en la URL: `?categoria=`)  |
| `/tienda/[slug]` | Detalle de un producto y "Agregar al pedido"           |
| `/carrito`   | El pedido: cantidades, avisos de precio y disponibilidad (el carrito vive en el navegador) |
| `/carrito/checkout` | Datos, entrega, día y horario, y pago del total     |
| `/pedido/resultado` | Resultado del pago de un pedido (vuelta de Mercado Pago). Pagado no es confirmado: lo confirma Maggie |
| `/workshops` | Próximas fechas y cómo funcionan                           |
| `/workshops/[slug]/inscripcion` | Inscripción a un workshop y pago del total |
| `/workshops/[slug]/inscripcion/resultado` | Resultado del pago (vuelta de Mercado Pago) |
| `/maggie`    | Historia, valores y la cocina                              |
| `/admin`     | Panel de administración (con login; ver [Panel de administración](#panel-de-administración)) |

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
2. En el **SQL Editor**, correr las migraciones en orden:
   - [`0001_catalogo.sql`](supabase/migrations/0001_catalogo.sql): las tablas, RLS, la vista `workshops_publicos`, la función `crear_inscripcion` y los buckets `productos` y `workshops`.
   - [`0002_auth_admin.sql`](supabase/migrations/0002_auth_admin.sql): la tabla `perfiles` (roles), `es_admin()` y los permisos de escritura de la admin (tablas y Storage).
   - [`0003_pagos.sql`](supabase/migrations/0003_pagos.sql): la tabla `pagos`, la seña y el vencimiento de las inscripciones, y `confirmar_pago`.
   - [`0004_inscripcion_solo_servidor.sql`](supabase/migrations/0004_inscripcion_solo_servidor.sql): `crear_inscripcion` solo desde el servidor (`service_role`).
   - [`0005_devoluciones.sql`](supabase/migrations/0005_devoluciones.sql): marcar como devueltos los pagos que había que devolver.
   - [`0006_pago_completo.sql`](supabase/migrations/0006_pago_completo.sql): pago completo al inscribirse (`sena_porcentaje` en 100).
   - [`0007_pedidos.sql`](supabase/migrations/0007_pedidos.sql): pedidos de la tienda (`pedidos`, `pedido_items`, `crear_pedido`), `pagos` de una inscripción o un pedido, y `aceptar_pedido` / `rechazar_pedido`. **Correrla antes de deployar el código que la usa.** La `confirmar_pago` vieja queda como envoltorio, así el deploy anterior sigue andando mientras tanto.
3. Copiar `.env.example` a `.env.local` y completarlo con los datos de **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: la URL del proyecto.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: la clave publishable (`sb_publishable_…`). Es pública y respeta RLS.
   - `SUPABASE_SECRET_KEY`: la clave secret (`sb_secret_…`). Se saltea RLS. La usan el seed, los tests y, desde el E6, el servidor para crear inscripciones y confirmar los pagos. **Nunca** va en el código ni en una variable `NEXT_PUBLIC_`.
   - `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y `NEXT_PUBLIC_SITE_URL`: Mercado Pago (ver abajo).
   - `CATALOGO_FOTOS_DIR`: la carpeta del catálogo de Maggie (la que tiene `fotos/` adentro).
4. Cargar el catálogo:

   ```bash
   npm run seed
   ```

   Lee `supabase/seed/catalogo.json`, sube las 198 fotos al bucket `productos` y hace upsert por slug. Se puede correr las veces que haga falta: deja la base igual. Los productos con `activo: false` quedan cargados pero ocultos. Los workshops salen de `data/workshops.ts` y se marcan como de ejemplo (no aceptan inscripciones) hasta que Maggie pase los reales.

5. **Deploy y CI:**
   - **GitHub** (**Settings → Secrets and variables → Actions**): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como *secrets*. El build prerenderiza el catálogo leyendo Supabase.
   - **Vercel:** las dos variables públicas y, del lado del servidor (sin `NEXT_PUBLIC_`), `SUPABASE_SECRET_KEY`, `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`. En producción, además, `NEXT_PUBLIC_SITE_URL`.

### Mercado Pago

Los workshops se pagan completos al inscribirse, con Checkout Pro. El flujo, los estados y las decisiones están en [docs/pagos.md](docs/pagos.md), y la prueba manual en sandbox, en [docs/pruebas-mercadopago.md](docs/pruebas-mercadopago.md).

| Variable | Dónde | Qué es |
|---|---|---|
| `MP_ACCESS_TOKEN` | Servidor (`.env.local`, Vercel) | Access token **de producción** (`APP_USR-…`) de **Tus integraciones → tu aplicación**. Para probar, el de la aplicación creada dentro de la cuenta vendedora de prueba; al publicar, el de la cuenta de Maggie. **No** el de prueba (`TEST-…`): con ese, el webhook da 401 |
| `MP_WEBHOOK_SECRET` | Servidor | Clave secreta de **Webhooks → Configurar notificaciones → Modo productivo**, de la misma aplicación que el token. El webhook es `https://<dominio>/api/v1/webhooks/mercadopago` con solo el evento **Pagos** |
| `NEXT_PUBLIC_SITE_URL` | Producción | URL pública (`https://…`) para las `back_urls`. Vacía: `https://$VERCEL_URL` (previews) o `http://localhost:3000`. La URL del webhook se carga solo en el panel de MP, no en la preferencia |

Qué credenciales van en cada etapa: [docs/pagos.md](docs/pagos.md#qué-credenciales-se-usan-en-cada-etapa).

Los previews de Vercel están protegidos, así que el webhook no les llega. Ahí el pago se confirma con la conciliación de la página de resultado. Un workshop sin precio no acepta inscripciones (422).

### API interna

API REST versionada en `/api/v1`. Todas las respuestas son `{ data }` si salieron bien o `{ error: { message, fields?, spotsLeft? } }` si no. Las lecturas públicas se cachean 5 minutos en la CDN; la API de admin y los errores llevan `no-store`.

| Método y ruta | Qué devuelve |
|---|---|
| `GET /api/v1/categorias` | Categorías activas, en orden |
| `GET /api/v1/productos?categoria=&destacados=` | Productos activos. 400 si la categoría no existe o los parámetros no son válidos |
| `GET /api/v1/productos/[slug]` | Un producto. 404 si no existe o está oculto |
| `GET /api/v1/workshops` | Próximos workshops, con lugares libres |
| `POST /api/v1/inscripciones` | Crea la inscripción y la preferencia de pago: 201 `{ id, initPoint }`, 400, 404, 409 (con `spotsLeft`), 422 (sin precio), 429 (5 por IP cada 10 minutos) o 502 (falló Mercado Pago) |
| `POST /api/v1/pedidos` | Crea el pedido de la tienda y la preferencia de pago. Los precios los calcula la base. Responde 201 `{ id, numero, initPoint }`, 400 (con `fields`, también para fecha, horario, envío o productos que ya no están), 403 (`Origin` de otro sitio), 429 (5 por IP cada 10 minutos) o 502 |
| `POST /api/v1/webhooks/mercadopago` | Avisos de pago de Mercado Pago, con firma `x-signature`. Atiende inscripciones y pedidos, según el `external_reference`. Responde 200, 401 si la firma no es válida o 500 para que MP reintente |

Las rutas sin versión (`/api/categorias`, `/api/productos`…) redirigen con 308 a `/api/v1`. El 308 conserva el método, así que un `POST /api/inscripciones` sigue funcionando.

**API de admin** (`/api/v1/admin`). Pide sesión con rol admin: sin sesión, 401; sin rol, 403. Las escrituras tienen que venir del mismo sitio (`Origin`).

| Método y ruta | Qué hace |
|---|---|
| `GET`, `POST /api/v1/admin/productos` | Lista todos (también inactivos) · crea (201). El slug se genera desde el nombre |
| `GET`, `PATCH`, `DELETE /api/v1/admin/productos/[id]` | Lee · edita (`sizes` reemplaza todos los tamaños) · borra con sus fotos (204) |
| `POST /api/v1/admin/productos/[id]/imagenes` | Sube una foto (multipart: `file`, `alt`, `flavor?`). Acepta webp, jpg o png de hasta 5 MB |
| `PATCH`, `DELETE /api/v1/admin/productos/[id]/imagenes/[imagenId]` | Cambia `alt`, `flavor`, `order` o `cover` (portada) · borra la foto y su archivo |
| `GET`, `POST /api/v1/admin/workshops` | Lista todos · crea |
| `GET`, `PATCH`, `DELETE /api/v1/admin/workshops/[id]` | Lee · edita · borra (409 si tiene inscripciones) |
| `GET /api/v1/admin/workshops/[id]/inscripciones` | Inscripciones del workshop, con datos personales |
| `PATCH /api/v1/admin/inscripciones/[id]` | Cambia el estado (`{ "status": "pendiente_sena" \| "reservada" \| "cancelada" }`). 409 si reactivarla supera el cupo |

Errores: 400 (con `fields` por campo), 401, 403, 404, 409 y 500 genérico, sin stack trace. Cada cambio regenera al instante las páginas públicas afectadas.

## Panel de administración

El login está en [`/admin/ingresar`](http://localhost:3000/admin/ingresar). La seguridad (sesión, roles, proxy, rate limiting) está explicada en [docs/seguridad.md](docs/seguridad.md). Cómo se usa, contado para Maggie, está en [docs/guia-panel.md](docs/guia-panel.md).

| Ruta | Qué hay |
|---|---|
| `/admin` | Resumen: próximos workshops con lugares, pendientes de pago y pagos para devolver |
| `/admin/productos` | Lista con buscador y filtros, precio en línea, pausar con Deshacer y destacados (hasta 4) |
| `/admin/productos/nuevo` y `/[id]` | Editor: datos, tamaños y precios, fotos (webp de hasta 1600 px), visibilidad, temporada, sabores |
| `/admin/workshops`, `/nuevo` y `/[id]` | Próximos y pasados; detalle con las pestañas Inscriptas y Datos |
| `/admin/inscripciones` | Todas, con filtros, estado editable, pago, WhatsApp y "Para devolver" |

Todo usa Server Actions sobre la capa `lib/admin/*`, con los mismos esquemas zod que la API, y cada cambio revalida las páginas públicas.

### Crear la usuaria admin

1. **Cerrar el registro público:** en **Authentication → Sign In / Providers**, desactivar **Allow new users to sign up**. Así nadie puede crearse una cuenta con la clave publishable.
2. **Crear la usuaria:** en **Authentication → Users → Add user → Create new user**, cargar el email y una contraseña, y marcar **Auto Confirm User**. La contraseña no se escribe en ningún archivo del repo.
3. **Asignarle el rol:** en el **SQL Editor**, con su email:

   ```sql
   insert into public.perfiles (id, nombre, rol)
   select id, null, 'admin' from auth.users where email = '<email-de-la-admin>'
   on conflict (id) do update set rol = excluded.rol;
   ```

   Para sacarle el rol: `delete from public.perfiles where id = (select id from auth.users where email = '<email>');`

Una cuenta sin fila en `perfiles` puede ingresar, pero recibe 403 "No tenés permiso".

### Recuperar la contraseña

"¿Olvidaste tu contraseña?" manda un mail con un link. El link pasa por Supabase y vuelve a `/admin/auth/confirm`, que abre una sesión y lleva a `/admin/nueva-contrasena`. La ruta acepta las dos formas de link:

| Link | Plantilla | Cómo se canjea | Limitación |
|---|---|---|---|
| `?code=…` (PKCE) | La de Supabase por defecto (`{{ .ConfirmationURL }}`) | `exchangeCodeForSession` | Solo abre en el mismo navegador donde se pidió |
| `?token_hash=…&type=recovery` | La propia (abajo) | `verifyOtp` | Ninguna: abre en cualquier navegador o en el celular |

Si el link venció, ya se usó o se abrió en otro navegador, `/admin/recuperar` lo dice y ofrece el botón "Pedir otro link".

**Configuración (una sola vez):** en **Authentication → URL Configuration → Redirect URLs**, agregar:

- `http://localhost:3000/admin/auth/confirm`;
- `https://home-bakery-brown.vercel.app/admin/auth/confirm`;
- para las previews de Vercel, `https://home-bakery-*-trevisancata.vercel.app/admin/auth/confirm` (Supabase acepta `*` en las Redirect URLs).

#### TODO(SMTP): mails de producción

Hoy el proyecto usa el SMTP por defecto de Supabase, que tiene dos límites:

1. **Solo manda mails a los miembros del equipo del proyecto** en Supabase. A cualquier otro email no le llega nada.
2. **Manda pocos mails por hora** en todo el proyecto: 2 según la [documentación de rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Además, sin SMTP propio no se pueden editar las plantillas. Por eso hoy se usa la de por defecto, con el link PKCE.

**Mientras tanto,** si Maggie se olvida la contraseña, la reseteo yo desde **Authentication → Users**: busco su usuaria, entro a **Reset password** o le cargo una contraseña nueva, y se la paso por un canal privado, nunca por el repo.

**Para producción:**

1. **Configurar un SMTP propio** (por ejemplo, [Resend](https://resend.com)) en **Authentication → Emails → SMTP Settings**, con un dominio verificado como remitente.
2. **Pegar la plantilla** en **Authentication → Emails → Reset password**:
   - Asunto: `Elegí una contraseña nueva para el panel de Home Bakery`
   - Cuerpo:

     ```html
     <h2>Elegí una contraseña nueva</h2>
     <p>Pediste cambiar la contraseña del panel de Home Bakery.</p>
     <p>
       <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">
         Elegir una contraseña nueva
       </a>
     </p>
     <p>El link vence en una hora y se puede usar una sola vez.</p>
     <p>Si no lo pediste, ignorá este mail: tu contraseña no cambia.</p>
     ```

   `{{ .RedirectTo }}` es el `/admin/auth/confirm` del sitio desde donde se pidió el link (local, preview o producción). Con `token_hash`, el link funciona en cualquier navegador.
3. **Probar** con "¿Olvidaste tu contraseña?" y borrar este TODO.

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
| `npm run test:e2e` | Tests e2e y de la API con Playwright (build de producción). Necesita las seis migraciones y `SUPABASE_SECRET_KEY`: crea y borra sus propias usuarias, productos, workshops y pagos de prueba. Mercado Pago es un mock local (`e2e/support/mp-mock.ts`), sin credenciales reales |
| `npm run compare` | Compara el sitio con el mockup              |

Los tests leen y escriben el proyecto de Supabase de `.env.local` sin ensuciar los datos reales: cada test que inscribe crea su propio workshop de prueba (slug `e2e-…`) y lo borra al terminar, con sus inscripciones. Al final de la corrida, un teardown borra cualquier `e2e-…` que haya quedado.

### Los e2e no dependen de los datos de producción

Los e2e corren contra el mismo proyecto de Supabase que el sitio, y el catálogo lo edita Maggie desde el panel: precios (hoy, $ 10 en todos hasta cargar los reales), destacados, productos ocultos, fotos. Un test que lee esos datos falla cuando ella cambia algo, aunque el código esté bien. Pasó con un precio y con una fecha de ejemplo vencida (ver [errores.md](docs/errores.md#tests-atados-a-los-precios-y-destacados-reales)).

Por eso:
- **Cada test crea lo que necesita y lo borra al terminar**, con slug `e2e-…`:
  - workshops con el fixture `workshop` o `crearWorkshopDePrueba({ esEjemplo })`, y con `crearWorkshopPorApi` cuando tienen que aparecer en `/workshops` (`e2e/support/supabase.ts`);
  - productos con `crearProductoDePrueba` y `borrarProductoDePrueba`, o con `crearProductoPorApi` y `borrarProductoPorApi` (`e2e/support/productos.ts`).
- **Se comprueba lo propio, no totales:** que el producto de prueba aparece o no aparece, nunca cuántos productos hay.
- **Listados estáticos:** `/tienda` y `/workshops` son estáticas (ISR). Para que algo aparezca en el listado se crea con la API de admin, que revalida la página, y el test la abre con `abrirHastaVer`: con otros tests revalidando en paralelo, puede tardar un momento en verse. Para la API pública, el detalle y la inscripción alcanza con insertarlo en la base.
- **Datos fijos:** las categorías son lo único real que se usa. Salen del seed, Maggie no las edita desde el panel, y una categoría de prueba aparecería en los filtros mientras corren los demás tests.
- **El teardown** borra al final todo lo `e2e-…` que haya quedado si un test se cortó.
