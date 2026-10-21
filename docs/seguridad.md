# Seguridad del panel

Cómo se protege el panel de administración (`/admin`) y su API (`/api/v1/admin`). El esquema está en [`supabase/migrations/0002_auth_admin.sql`](../supabase/migrations/0002_auth_admin.sql); los permisos de cada rol, en [`docs/modelo-de-datos.md`](modelo-de-datos.md#permisos-por-rol).

## AuthN vs AuthZ

Son dos preguntas distintas y se responden en lugares distintos:

| | Pregunta | Quién la responde | Si falla |
|---|---|---|---|
| **Autenticación (AuthN)** | ¿Quién sos? | Supabase Auth: email y contraseña → sesión (JWT) | **401** en la API, redirección al login en las páginas |
| **Autorización (AuthZ)** | ¿Podés hacer esto? | El rol de la tabla `perfiles`, con `es_admin()` | **403**: "No tenés permiso" |

Ingresar bien no alcanza: una cuenta sin rol entra (AuthN ✓) y recibe 403 (AuthZ ✗). Lo prueba el e2e "Sin rol".

## Sesión: JWT en cookies HttpOnly

1. El login es una Server Action (`app/admin/actions.ts`) que llama a `signInWithPassword` desde el servidor. Supabase devuelve un **access token** (un JWT firmado, válido una hora) y un **refresh token**.
2. `@supabase/ssr` los guarda en cookies con estas opciones (`lib/supabase/cookies.ts`):
   - **`HttpOnly`:** el JavaScript del navegador no las puede leer. Si hubiera un XSS, no se puede robar la sesión. Se puede porque no hay cliente de Supabase en el navegador: el login y todo el panel pasan por el servidor.
   - **`Secure`:** solo viajan por HTTPS (en producción; en `localhost` no hay HTTPS).
   - **`SameSite=Lax`:** el navegador no las manda en un POST que viene de otro sitio. Es la primera barrera contra CSRF.
3. En cada pedido a `/admin`, el proxy renueva el access token si está por vencer y escribe las cookies nuevas, con `Cache-Control: no-store` para que una respuesta con sesión nunca quede en una caché compartida.

**`getClaims()`, no `getSession()`:** `getSession()` lee la cookie tal cual, sin verificarla, y cualquiera puede editar una cookie. `getClaims()` verifica la firma del JWT antes de confiar en lo que dice. Toda decisión de acceso usa `getClaims()`.

## Contraseñas: bcrypt en Supabase

Las contraseñas no pasan nunca por nuestra base ni por nuestros logs: las guarda Supabase Auth. Según [su documentación](https://supabase.com/docs/guides/auth/password-security), Supabase guarda solo un **hash bcrypt con salt aleatorio**, nunca la contraseña.

- **bcrypt** es lento a propósito: probar millones de contraseñas contra un hash robado lleva años, no minutos.
- **El salt** hace que dos contraseñas iguales den hashes distintos e inutiliza las tablas precalculadas.
- La contraseña nueva pide 8 caracteres como mínimo, que es lo que recomienda Supabase, y 72 como máximo, porque bcrypt usa solo los primeros 72 bytes.

## RBAC: roles en `perfiles`

- **Un perfil por usuaria**, con `rol in ('admin', 'editor')`. Sin perfil = sin rol.
- **`es_admin()`:** función `security definer` con `search_path = ''`. Las políticas la usan como `(select public.es_admin())`, así Postgres la evalúa una vez por consulta y no una vez por fila.
- **Los roles no se escriben con la clave publishable:** ni siquiera la admin puede cambiarse el rol. Se asignan con SQL en el dashboard (ver [README](../README.md#panel-de-administración)) o con la secret key.
- **`editor`** queda reservado para más adelante y hoy no tiene permisos de escritura.

## Defensa en profundidad

Cada pedido al panel pasa por varias capas. Si una falla (un matcher mal escrito, una ruta nueva que se olvidó del chequeo), la siguiente lo frena:

```
pedido → proxy.ts → layout/página, route handler o Server Action → RLS en Postgres
```

1. **`proxy.ts`, la aduana.** Corre antes que nada, solo en `/admin/:path*` y `/api/v1/admin/:path*`. Renueva la sesión y frena a quien no la tiene: las páginas redirigen a `/admin/ingresar?next=…` y la API responde 401 JSON. Es un control **optimista**: no consulta el rol en la base, para ser rápido.
2. **`lib/auth.ts` (DAL).** Vuelve a verificar con `getClaims()` y `es_admin()` en cada lugar:
   - el layout y **cada página** del panel, con `requireAdminPage()`. Los layouts no se vuelven a renderizar al navegar, así que el chequeo del layout solo no alcanza;
   - cada route handler, con `withAdminApi`;
   - cada Server Action del panel, con `requireAdmin()`. Las Server Actions son POST a la página donde se usan, así que el proxy no las cubre por sí solo.
3. **RLS.** Las políticas de la migración 0002 exigen `es_admin()` para escribir. La capa de servicio (`lib/admin/*`) usa siempre el cliente con la sesión de la usuaria, nunca la secret key: aunque las dos capas anteriores fallaran, la base rechaza la escritura.

## 401 vs 403

- **401 Unauthorized:** no hay sesión o venció. Ingresar lo resuelve.
- **403 Forbidden:** hay sesión, pero sin permiso. Volver a ingresar con la misma cuenta no lo resuelve.

En las páginas, el 403 lo devuelve `forbidden()` de Next (`experimental.authInterrupts`). Responde con status 403 real y muestra `app/forbidden.tsx`.

## Errores sin filtrar información

- **Login:** el mismo mensaje para todo ("El email o la contraseña no coinciden"), exista o no el email. Así no se puede averiguar qué emails tienen cuenta.
- **Recuperación:** responde "Si el email está registrado, te llega un link" siempre.
- **API:** `withApi` (`lib/api.ts`) traduce los errores a 400, 401, 403, 404, 409 o 500. Un 500 nunca lleva el stack trace ni el mensaje de la base. Al log va solo el contexto y el código (`Error al crear el producto (23505)`), nunca el `details` de Postgres, que puede incluir la fila con datos personales.

## Validación y saneamiento

Todo lo que entra se valida en el servidor con zod (`lib/admin/schemas.ts`), aunque el formulario ya haya validado en el navegador:

- **Textos:** trim, sin caracteres de control y sin etiquetas HTML. Las etiquetas se rechazan con "No uses etiquetas HTML.", no se borran en silencio. React ya escapa todo al mostrarlo; esto evita guardar HTML que otro cliente podría mostrar sin escapar.
- **Objetos estrictos:** un campo que no está en el esquema (por ejemplo, `"admin": true`) es un 400. Así se evita la asignación masiva.
- **Fotos:** se valida el contenido real con `sharp` (formato webp, jpg o png, ancho y alto), no la extensión ni el tipo que manda el navegador, porque los dos se pueden falsificar. Además, 5 MB como máximo, igual que el bucket.

## CSRF

- **Cookies `SameSite=Lax`:** un formulario de otro sitio no manda la sesión en un POST.
- **Server Actions:** Next compara `Origin` con `Host` y rechaza las que vienen de otro sitio.
- **API de admin:** `withAdminApi` rechaza con 403 un POST, PATCH o DELETE cuyo `Origin` no es el sitio.
- **Cerrar sesión** es un POST (Server Action), nunca un link: un GET no cambia estado.

## Rate limiting

**El de Supabase Auth** (valores por defecto, según [su documentación](https://supabase.com/docs/guides/auth/rate-limits)):

| Qué | Límite | Por |
|---|---|---|
| Login y renovación de sesión (`/token`) | 150 pedidos cada 5 minutos | IP |
| Recuperación y otros (`/recover`, `/user`…) | 30 pedidos cada 5 minutos | IP |
| Pedir el link de recuperación | 1 cada 60 segundos | Usuaria |
| Mails con el proveedor incluido | 2 por hora | Proyecto |

Como el login se hace desde el servidor, Supabase ve la IP de Vercel, no la de quien ingresa. Ese límite "por IP" es entonces uno solo, compartido por todas.

**El propio** (`lib/rate-limit.ts`):
- Cuenta 5 intentos **fallidos** cada 15 minutos por IP (`x-forwarded-for`, que en Vercel pone la plataforma). Al sexto, "Demasiados intentos. Probá de nuevo en N minutos." y no se llama a Supabase.
- Un login correcto borra el contador.
- Vive en memoria: cada instancia de Vercel tiene el suyo y se reinicia con cada cold start. Hay un `TODO(Redis)` para pasarlo a un almacenamiento compartido (por ejemplo, Upstash).

Lo prueba `e2e/rate-limit.spec.ts`: después del bloqueo, ni la contraseña correcta entra.

## Registro público deshabilitado

El panel no tiene registro. Además, en Supabase hay que desactivar **Authentication → Sign In / Providers → Allow new users to sign up**. Si no, cualquiera con la clave publishable (que es pública) podría crearse una cuenta por la API de Auth. Esa cuenta no tendría rol y recibiría 403, pero no tiene por qué existir.

## Por qué las páginas públicas no leen cookies

Leer cookies vuelve dinámica una página: se renderiza en cada visita y pierde el ISR. Por eso:

- Las páginas públicas usan `createPublicClient()` (`lib/supabase/server.ts`), sin cookies ni sesión: siguen estáticas, con ISR, y se regeneran con `revalidatePath` cuando cambia algo desde el panel.
- El proxy corre solo en `/admin` y `/api/v1/admin`. Un proxy en todas las rutas tendría que leer cookies en cada pedido del sitio.
- Solo el panel usa `createAuthClient()` (`lib/supabase/server-auth.ts`).

El `npm run build` lo confirma: `/`, `/tienda`, `/tienda/[slug]` y `/workshops` salen como estáticas (○/●) con revalidación de 5 minutos, y todo `/admin` como dinámico (ƒ).
