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
| Mails con el SMTP por defecto (solo al equipo del proyecto) | 2 por hora | Proyecto |

Como el login se hace desde el servidor, Supabase ve la IP de Vercel, no la de quien ingresa. Ese límite "por IP" es entonces uno solo, compartido por todas.

**Los propios** (`lib/rate-limit.ts`). Las inscripciones tienen el suyo (ver [Pagos](#pagos)). El del login:
- Cuenta 5 intentos **fallidos** cada 15 minutos por IP (`x-forwarded-for`, que en Vercel pone la plataforma). Al sexto, "Demasiados intentos. Probá de nuevo en N minutos." y no se llama a Supabase.
- Un login correcto borra el contador.
- Vive en memoria: cada instancia de Vercel tiene el suyo y se reinicia con cada cold start. Hay un `TODO(Redis)` para pasarlo a un almacenamiento compartido (por ejemplo, Upstash).

Lo prueba `e2e/rate-limit.spec.ts`: después del bloqueo, ni la contraseña correcta entra.

## Recuperación de contraseña

- **Siempre el mismo aviso:** `/admin/recuperar` responde "Si el email está registrado, te llega un link" exista o no el email.
- **Dos formas de link:** `/admin/auth/confirm` acepta las dos que manda Supabase. Con `?code=` (flujo PKCE, la plantilla por defecto), el link se canjea con `exchangeCodeForSession` y solo abre en el navegador donde se pidió, porque el *code verifier* quedó en una cookie. Con `?token_hash=` (plantilla propia), se canjea con `verifyOtp` y abre en cualquier navegador. Si no sirve (venció, ya se usó o se abrió en otro navegador), lo dice y ofrece pedir otro.
- **TODO(SMTP):** el SMTP por defecto de Supabase solo manda mails a los miembros del equipo del proyecto, y pocos por hora. En producción hay que configurar un SMTP propio (por ejemplo, Resend) y pegar la plantilla con `token_hash`; los pasos y el HTML están en el [README](../README.md#todosmtp-mails-de-producción). Mientras tanto, si Maggie olvida la contraseña, se la resetea la desarrolladora desde **Authentication → Users**.

## Registro público deshabilitado

El panel no tiene registro. Además, en Supabase hay que desactivar **Authentication → Sign In / Providers → Allow new users to sign up**. Si no, cualquiera con la clave publishable (que es pública) podría crearse una cuenta por la API de Auth. Esa cuenta no tendría rol y recibiría 403, pero no tiene por qué existir.

## Pagos

El pago de la seña está explicado en [pagos.md](pagos.md). Lo que importa para la seguridad:

- **Webhook firmado:** `POST /api/v1/webhooks/mercadopago` valida `x-signature` antes de hacer nada (`lib/pagos/firma.ts`).
  - El HMAC-SHA256 del manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` lo calcula el validador del SDK oficial, con `MP_WEBHOOK_SECRET` como clave, y lo compara en **tiempo constante**: el tiempo de respuesta no revela cuántos caracteres coinciden.
  - El `ts` puede estar a lo sumo **5 minutos** del reloj del servidor. Así no sirve reenviar un aviso viejo capturado.
  - Si la firma es inválida, faltan headers o el `ts` está fuera de rango: **401**. Al log va solo el motivo y el `x-request-id`, nunca la firma ni el secret.
- **Nunca se confía en el aviso:** del body solo se usa el id del pago. El estado, el monto y la referencia salen de la API de MP (`GET /v1/payments/{id}`). Un aviso inventado con una firma válida igual tendría que existir en MP.
- **Nunca se confía en la vuelta del checkout:** la página de resultado ignora `status`, `payment_id` y el resto de los query params. Lee el estado en la base, del lado del servidor.
- **El monto lo pone la base:** `crear_inscripcion` calcula la seña y `confirmar_pago` reserva solo si lo que cobró MP es exactamente eso, en ARS. El navegador nunca manda un monto.
- **`confirmar_pago` solo para `service_role`:** ni la clave publishable ni la sesión de la admin pueden marcar una inscripción como pagada. Por eso el servidor necesita `SUPABASE_SECRET_KEY` desde el E6. La usa solo para:
  - crear la inscripción;
  - confirmar el pago;
  - leer el resultado;
  - guardar la preferencia.
- **Secretos solo en el servidor:** `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y `SUPABASE_SECRET_KEY` no llevan `NEXT_PUBLIC_`, se leen solo en módulos `server-only` y nunca se escriben en los logs. Los errores de MP se registran con su status HTTP, no con el cuerpo.
- **Mock solo en localhost:** `MP_API_BASE_URL` (para los tests) solo acepta `http://localhost` o `127.0.0.1`. Una variable mal cargada no puede mandar el token a otro host.
- **Inscripciones solo por la API** (migración 0004): `crear_inscripcion` ya no se puede ejecutar con la clave publishable, solo con `service_role`. Antes cualquiera podía llamarla directo por la API de Supabase, saltándose el formulario y el rate limit. Era el riesgo aceptado del E4 ([modelo de datos](modelo-de-datos.md#riesgo-cerrado-la-función-se-podía-ejecutar-con-la-clave-publishable)), y ahora está cerrado. Lo prueba un e2e: el rpc con la clave publishable responde `42501`.
- **Rate limit de inscripciones:** 5 inscripciones válidas por IP cada 10 minutos (`lib/rate-limit.ts`, en memoria, `TODO(Redis)`), con 429 y `Retry-After`. Frena a quien quiera ocupar el cupo con inscripciones falsas, que igual vencen solas a los 30 minutos.
- **Datos personales:** `pagos.detalle` guarda solo datos del pago (estado, medio, fechas), nunca los del pagador. La página de resultado no muestra el nombre ni el email: con el id en la URL solo se ve el estado y el monto.

## Por qué las páginas públicas no leen cookies

Leer cookies vuelve dinámica una página: se renderiza en cada visita y pierde el ISR. Por eso:

- Las páginas públicas usan `createPublicClient()` (`lib/supabase/server.ts`), sin cookies ni sesión: siguen estáticas, con ISR, y se regeneran con `revalidatePath` cuando cambia algo desde el panel.
- El proxy corre solo en `/admin` y `/api/v1/admin`. Un proxy en todas las rutas tendría que leer cookies en cada pedido del sitio.
- Solo el panel usa `createAuthClient()` (`lib/supabase/server-auth.ts`).

El `npm run build` lo confirma: `/`, `/tienda`, `/tienda/[slug]` y `/workshops` salen como estáticas (○/●) con revalidación de 5 minutos, y todo `/admin` como dinámico (ƒ).
