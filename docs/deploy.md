# Deploy, CI y operación

Cómo llega un cambio a producción, dónde vive cada cosa y qué hacer si algo sale mal. El sitio está en [Vercel](https://vercel.com) y la base en [Supabase](https://supabase.com).

## Índice

- [Entornos](#entornos)
- [Variables de entorno](#variables-de-entorno)
- [Flujo de trabajo](#flujo-de-trabajo)
- [CI](#ci)
- [Migraciones](#migraciones)
- [Dominio, DNS y SSL](#dominio-dns-y-ssl)
- [Logs y monitoreo](#logs-y-monitoreo)
- [Rollback](#rollback)
- [Checklist para pasar a producción real](#checklist-para-pasar-a-producción-real)

## Entornos

| Entorno | Cuándo se crea | URL | Base | Credenciales |
|---|---|---|---|---|
| **Production** | Cada merge a `main` | [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app) | El proyecto de Supabase | Las variables de **Production** en Vercel |
| **Preview** | Cada push a un PR | Una URL por deploy (`home-bakery-…-trevisancata.vercel.app`), que Vercel comenta en el PR | El mismo proyecto de Supabase | Las variables de **Preview** en Vercel |
| **Local** | `npm run dev` o `npm run test:e2e` | `http://localhost:3000` (dev) o `:3100` (tests) | El mismo proyecto de Supabase | `.env.local` (no se sube al repo) |

Cosas a tener en cuenta:

- **Hay una sola base.** Production, Preview y local leen y escriben el mismo proyecto de Supabase. Por eso los tests marcan todo lo que crean con `e2e-…` y lo borran al terminar, y por eso no corren en CI (ver [CI](#ci)).
- **Los previews tienen Deployment Protection:** solo los ve quien tiene sesión en Vercel con acceso al proyecto. Por eso el webhook de Mercado Pago no les llega; ahí el pago se confirma con la conciliación de la página de resultado ([pagos.md](pagos.md)).
- **Mercado Pago: Production, Preview y local usan las mismas credenciales.** Son las de producción (`APP_USR-…`) de la aplicación "Home-Bakery2", creada dentro de la **cuenta vendedora de prueba** de Mercado Pago: no cobran plata real. En Vercel están cargadas en Production y en Preview, y en local van en `.env.local`. Los e2e no las usan: apuntan a un mock local.
- **El webhook de esa aplicación** está en modo productivo y apunta a `https://home-bakery-brown.vercel.app/api/v1/webhooks/mercadopago`. Por eso el aviso de un pago hecho desde un preview (o desde local) llega a **producción**, que lo registra en la misma base. El preview no lo recibe y concilia el pago desde la página de resultado ([pruebas-mercadopago.md](pruebas-mercadopago.md#preview-de-vercel-sin-webhook)).
- **Para producción real** se reemplazan por las credenciales de producción de la **cuenta de Maggie**, con su propio webhook y su propia clave secreta ([pruebas-mercadopago.md](pruebas-mercadopago.md#configuración-que-funciona) y [pagos.md](pagos.md#qué-credenciales-se-usan-en-cada-etapa)). Ver el [checklist](#checklist-para-pasar-a-producción-real).

## Variables de entorno

La referencia es [`.env.example`](../.env.example): tiene todas las variables con un comentario de para qué sirve cada una. Si se suma una variable nueva, va primero ahí.

| Variable | Para qué sirve | Pública o secreta | Production | Preview | Local | CI |
|---|---|---|:-:|:-:|:-:|:-:|
| `NEXT_PUBLIC_SUPABASE_URL` | La URL del proyecto de Supabase | Pública (llega al navegador) | ✓ | ✓ | ✓ | ✓ (secret de GitHub, para el build) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Leer la base respetando RLS | Pública | ✓ | ✓ | ✓ | ✓ (secret de GitHub, para el build) |
| `SUPABASE_SECRET_KEY` | El servidor crea inscripciones y pedidos y confirma pagos; el seed y los tests preparan datos. Se saltea RLS | **Secreta** | ✓ | ✓ | ✓ | — |
| `MP_ACCESS_TOKEN` | Crear las preferencias de pago y consultar pagos | **Secreta** | ✓ | ✓ | ✓ | — |
| `MP_WEBHOOK_SECRET` | Validar la firma de los avisos de Mercado Pago | **Secreta** | ✓ | ✓ | ✓ | — |
| `NEXT_PUBLIC_SITE_URL` | La URL pública, para las vueltas de Mercado Pago, el sitemap y el robots.txt. Vacía: `https://$VERCEL_URL` o `http://localhost:3000` | Pública | ✓ | — | opcional | — |
| `CATALOGO_FOTOS_DIR` | La carpeta con las fotos del catálogo para `npm run seed` | Local (no es secreta, es una ruta) | — | — | ✓ | — |
| `INSCRIPCIONES_RATE_LIMIT_MAX`, `PEDIDOS_RATE_LIMIT_MAX` | Subir el rate limit (los e2e lo suben a 1000). Sin valor: 5 | — | — | — | solo tests | — |
| `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA` | Las pone Vercel solo: la URL del deploy y el commit (lo muestra `/api/v1/health`) | — | auto | auto | — | — |

**Públicas vs. secretas:** las que empiezan con `NEXT_PUBLIC_` se copian al JavaScript del navegador durante el build: cualquiera las puede ver, así que solo pueden ser datos públicos. Las secretas nunca llevan ese prefijo y solo las usa el servidor.

**Al cambiar una variable en Vercel** el cambio no se aplica solo: hay que hacer un **redeploy** (**Deployments → el último de Production → ⋯ → Redeploy**). Las `NEXT_PUBLIC_` quedan escritas en el build, así que necesitan sí o sí un build nuevo. Si se cambia una que también usa el CI, actualizarla además en GitHub (**Settings → Secrets and variables → Actions**).

## Flujo de trabajo

```
rama → PR → CI + preview → revisión → squash and merge → deploy automático
```

1. **Rama** desde `main` (`feat/…`, `fix/…`, `chore/…`).
2. **Antes de abrir el PR, en local:** `npm run lint`, `npm run typecheck`, `npm run build` y **`npm run test:e2e`** (la suite completa). Los e2e son un paso obligatorio antes de mergear porque el CI no los corre.
3. **PR:** GitHub Actions corre el check `build` ([CI](#ci)) y Vercel arma un preview.
4. **Revisión:** se lee el diff y se prueba el preview.
5. **Squash and merge:** `main` está protegida: no se puede mergear sin el check `build` en verde y con la rama al día con `main`.
6. **Deploy automático:** Vercel deploya `main` a Production en un par de minutos.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) corre en cada PR y en cada push a `main`, en un solo job llamado **`build`**. Ese nombre es el check obligatorio de la protección de `main`: si se cambia, hay que actualizar la regla en **Settings → Branches**.

| Paso | Qué verifica |
|---|---|
| `npm ci` | Que el `package-lock.json` esté al día |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`next typegen` arma los tipos de las rutas y `tsc --noEmit` los chequea) |
| `npm run build` | Que el sitio compile. Prerenderiza el catálogo con la clave publishable |
| `npm run test:unit` | Los tests unitarios (proyecto `unit` de Playwright, [`playwright.unit.config.ts`](../playwright.unit.config.ts)): firma del webhook, montos, fechas, carrito, temporadas. No abren navegador ni levantan el servidor |

Si algún paso falla, el job falla y el PR no se puede mergear. Cuando falla, el reporte html de Playwright queda como artifact (`playwright-report`, 14 días) en la página de la corrida.

**Caches:** la de npm (`setup-node`) y la del build de Next (`.next/cache`). No se instala Chromium porque los unitarios no lo usan; si algún día los e2e corren en CI, hay que sumar `npx playwright install --with-deps chromium` y cachear `~/.cache/ms-playwright` con la versión de Playwright como clave.

### Por qué los e2e no corren en CI

- **Comparten la base de producción.** Crean y borran usuarias, workshops, pedidos y fotos en el mismo proyecto de Supabase que usa el sitio publicado. Dos corridas a la vez (dos PRs) se pisarían, y un teardown cortado deja datos de prueba en producción.
- **El rate limit bloquea los logins 15 minutos.** `rate-limit.spec.ts` dispara a propósito el bloqueo del login; además, cada corrida consume el límite de Supabase Auth del proyecto, que es el mismo de producción.
- **Necesitan la secret key.** Para preparar y limpiar datos usan `SUPABASE_SECRET_KEY`, que se saltea RLS. Tenerla en GitHub Actions es exponer la llave de toda la base a cualquier workflow.

Para correrlos en CI haría falta un proyecto de Supabase solo para tests (o Supabase local con Docker) con las migraciones aplicadas.

### Dependabot

[`.github/dependabot.yml`](../.github/dependabot.yml) revisa las dependencias de npm y las acciones de GitHub todos los lunes. Junta los minors y patches en un solo PR por ecosistema; los majors llegan de a uno. Como cualquier PR, pasan por el CI; antes de mergear, correr los e2e en local.

## Migraciones

Las migraciones (`supabase/migrations/`) se corren a mano en el **SQL Editor** de Supabase. Reglas:

1. **Correr la migración ANTES de mergear el código que la usa.** Como hay una sola base, la migración afecta a Production apenas se corre.
2. **Siempre compatibles hacia atrás:** el código que está publicado tiene que seguir andando con la base nueva, porque entre que se corre la migración y termina el deploy pasan minutos. Se agregan tablas, columnas y funciones; no se borran ni se renombran las que usa el código actual. Así se hicieron la 0007 a la 0010: por ejemplo, la 0007 dejó la `confirmar_pago` vieja como envoltorio de la nueva.
3. Si algún día hay que sacar algo, va en dos pasos: primero un deploy que deja de usarlo, después la migración que lo borra.

## Dominio, DNS y SSL

**Hoy:** no hay dominio propio. El sitio queda en el dominio que da Vercel, `home-bakery-brown.vercel.app`, y el certificado HTTPS lo emite y lo renueva Vercel solo.

**Para cuando Maggie compre un dominio** (pasos genéricos, como guía):

1. Comprarlo en un registrador (por ejemplo, NIC Argentina para `.com.ar`).
2. En Vercel, **Settings → Domains → Add**, cargar el dominio (`ejemplo.com.ar`) y también `www.ejemplo.com.ar`.
3. Vercel muestra qué registros DNS crear en el registrador. Usar siempre los que muestra el panel; suelen ser:
   - para el dominio raíz, un registro **A** a la IP de Vercel;
   - para `www`, un **CNAME** al host de Vercel.
4. **Verificación:** si el dominio ya se usa en otra cuenta de Vercel, pide además un registro **TXT**. Cuando el DNS se propaga (de minutos a unas horas), el dominio aparece como "Valid Configuration".
5. **Certificado:** Vercel emite el SSL automáticamente apenas valida el dominio; no hay que hacer nada.
6. **Redirección www:** en **Domains**, dejar uno como principal y el otro con "Redirect to" (308), así hay una sola URL.
7. **Después de cambiar el dominio:**
   - `NEXT_PUBLIC_SITE_URL` en Production con `https://` y el dominio nuevo, y **redeploy**;
   - la URL del webhook en Mercado Pago (`https://<dominio>/api/v1/webhooks/mercadopago`);
   - las **Redirect URLs** de Supabase Auth (`https://<dominio>/admin/auth/confirm`, ver el README);
   - el link del README.

## Logs y monitoreo

| Qué mirar | Dónde | Para qué |
|---|---|---|
| **Logs del servidor** | Vercel → el proyecto → **Logs** (filtro por ruta, estado o texto) | Errores 500, `console.error` de las APIs, Server Actions y webhooks |
| **Build y deploys** | Vercel → **Deployments** → el deploy → **Building** | Por qué falló un deploy |
| **Visitas** | Vercel → **Analytics** | Páginas vistas, de dónde vienen, países y dispositivos. Sin cookies ([seguridad.md](seguridad.md#analytics-sin-cookies)) |
| **Rendimiento real** | Vercel → **Speed Insights** | LCP, CLS e INP medidos en los teléfonos de las visitas (los de Lighthouse son de laboratorio: [lighthouse.md](lighthouse.md)) |
| **Avisos de pago** | Mercado Pago → Tus integraciones → la aplicación → **Webhooks → historial** | Si un aviso no llegó o el servidor respondió 401/500 (MP reintenta) |
| **Base y Auth** | Supabase → **Logs** (API, Postgres, Auth) | Errores de RLS (`42501`), funciones que fallan, logins |
| **¿Está vivo el sitio?** | `GET /api/v1/health` | Ver abajo |

### `/api/v1/health`

```
GET https://home-bakery-brown.vercel.app/api/v1/health
→ 200 { "status": "ok", "version": "0.1.0", "commit": "abc1234" }
```

Es liviano a propósito: **no consulta la base** ni Mercado Pago, así responde en milisegundos y una caída de Supabase no se confunde con el sitio caído. `commit` es el commit que está publicado (en local, `null`) y sirve para confirmar qué versión quedó después de un deploy o un rollback. No se cachea (`no-store`). Se puede usar con un monitor externo gratuito (UptimeRobot, Better Stack) que lo consulte cada pocos minutos y avise si no responde 200.

## Rollback

**Si un deploy rompió algo:**

1. Vercel → **Deployments** → el último deploy de Production que andaba → **⋯ → Instant Rollback** (o **Promote to Production**). Es instantáneo: no hace un build nuevo.
2. Confirmar con `/api/v1/health` que el `commit` es el anterior.
3. Arreglar en una rama nueva con su PR. Mientras tanto, Vercel no promueve solo los deploys nuevos de `main` hasta que se vuelva a promover uno a mano (o se deshaga el rollback).

**Si la migración ya corrió:** como las migraciones son compatibles hacia atrás, el código anterior sigue andando con la base nueva: el rollback del código alcanza. **No revertir la migración a mano**: borrar columnas o funciones puede perder datos que ya se cargaron (pedidos, pagos). Si la migración en sí tiene un error, se corrige con una migración nueva (la siguiente en número), que también pasa por PR.

## Checklist para pasar a producción real

Hoy el sitio está publicado pero con datos y credenciales de prueba. Antes de abrirlo a clientas:

- [ ] **Mercado Pago de Maggie:** crear la aplicación en su cuenta, cargar `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` de esa aplicación en Vercel (las dos a la vez), configurar el webhook y redeploy ([pagos.md](pagos.md#qué-credenciales-se-usan-en-cada-etapa)).
- [ ] **Datos bancarios reales** para la transferencia en `data/site.ts` (`TODO(Maggie)`), y sacar el aviso "datos de ejemplo" (`deEjemplo: false`).
- [ ] **SMTP propio** en Supabase y la plantilla de recuperar contraseña (README, `TODO(SMTP)`).
- [ ] **Dominio propio** ([arriba](#dominio-dns-y-ssl)) y `NEXT_PUBLIC_SITE_URL`.
- [ ] **Limpiar los datos de prueba** y **volver a cargar los precios reales** ([abajo](#datos-de-prueba-a-borrar)).
- [ ] **Contenido pendiente de Maggie** ([contenido-maggie.md](contenido-maggie.md)).
- [ ] Una compra real de punta a punta con un monto chico, y devolverla.

### Datos de prueba a borrar

Hasta ahora no hubo clientas reales: todo lo que hay en estas tablas salió de las pruebas.

- [ ] **Pedidos, pagos e inscripciones** de las pruebas manuales en el sandbox de Mercado Pago. Primero los pagos (tienen `on delete restrict` hacia pedidos e inscripciones), después los pedidos (los ítems se van en cascada) y las inscripciones.
- [ ] **El workshop `prueba-pago-sandbox`**, después de sus inscripciones y pagos.
- [ ] **Productos y workshops con slug `e2e-…`** que hayan quedado de un teardown cortado, con sus fotos en Storage, y las usuarias `e2e-…@example.com`. El teardown de los tests (`e2e/support/teardown.ts`) ya sabe borrarlos: alcanza con correr la suite completa una vez más y revisar que termine.
- [ ] **Precios reales:** hoy todos los productos están en $ 10, a pedido de Maggie. Hay que volver a cargar los de verdad desde el panel. TODO(Maggie): la lista de precios.
- [ ] **Fotos de recuerdo de los workshops pasados:** revisar que las que quedaron sean las reales y no fotos de prueba (se cambian desde el panel, en el workshop).

Para borrar, mejor un script revisado en un PR que borrados sueltos a mano. Después, estas consultas **de control** (solo `SELECT`, en el SQL Editor) tienen que dar lo que dice cada comentario:

```sql
-- 1. Pagos, pedidos e inscripciones: 0 en las tres (antes de abrir no hay clientas reales).
select
  (select count(*) from public.pagos)         as pagos,
  (select count(*) from public.pedidos)       as pedidos,
  (select count(*) from public.pedido_items)  as pedido_items,
  (select count(*) from public.inscripciones) as inscripciones;

-- 2. El workshop de la prueba del sandbox: 0 filas.
select id, slug, nombre from public.workshops where slug = 'prueba-pago-sandbox';

-- 3. Productos y workshops de los e2e: 0 filas.
select 'producto' as tipo, slug from public.productos where slug like 'e2e-%'
union all
select 'workshop', slug from public.workshops where slug like 'e2e-%';

-- 4. Fotos de los e2e en Storage: 0 filas.
select bucket_id, name from storage.objects
where bucket_id in ('productos', 'workshops') and name like 'e2e-%';

-- 5. Usuarias de prueba: 0 filas.
select id, email from auth.users where email like 'e2e-%@example.com';

-- 6. Precios de prueba: 0 filas (ningún tamaño en $ 10).
select p.slug, t.etiqueta, t.precio
from public.producto_tamanos t join public.productos p on p.id = t.producto_id
where t.precio = 10
order by p.slug;

-- 7. Fotos de recuerdo: revisar una por una que sean las reales.
select slug, nombre, fecha_inicio, foto_recuerdo_ruta, foto_recuerdo_alt
from public.workshops
where foto_recuerdo_ruta is not null
order by fecha_inicio desc;
```
