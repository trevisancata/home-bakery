# Pagos: workshops con Mercado Pago

Un workshop se paga **completo al inscribirse** con **Mercado Pago Checkout Pro**: no hay seña ni saldo. El esquema está en [`supabase/migrations/0003_pagos.sql`](../supabase/migrations/0003_pagos.sql), y la prueba manual en sandbox, en [`docs/pruebas-mercadopago.md`](pruebas-mercadopago.md).

## Pago completo (migración 0006)

Maggie decidió cobrar el 100% al inscribirse. La [`0006_pago_completo.sql`](../supabase/migrations/0006_pago_completo.sql) pone `sena_porcentaje` en 100 (default y workshops existentes). No se renombró nada: `sena_porcentaje`, `monto_sena` y el estado `pendiente_sena` quedan como **nombres internos** y en el sitio y el panel se lee "pago" o "total". `crear_inscripcion` y `confirmar_pago` no cambiaron: con el 100% calculan y exigen el total.

- El campo de porcentaje ya no está en el panel. La API de admin todavía lo acepta (`depositPercent`, de 1 a 100).
- El título de la preferencia es `Inscripción · <workshop> · N lugares`.

TODO: los pedidos de la tienda se pagan con el mismo esquema cuando exista el carrito.

## El flujo

```mermaid
sequenceDiagram
  autonumber
  actor P as Persona
  participant W as Web (Next)
  participant DB as Supabase
  participant MP as Mercado Pago

  P->>W: Formulario de inscripción
  W->>DB: crear_inscripcion() con service_role (bloquea el workshop, valida cupo y precio)
  DB-->>W: id, monto_sena, vence_at (+30 min)
  W->>MP: Crear preferencia (total, external_reference = id, vence con la reserva, sin notification_url)
  MP-->>W: init_point
  W-->>P: 201 { id, initPoint } → "Pagar con Mercado Pago"
  P->>MP: Paga en Checkout Pro

  par Webhook (producción, URL del panel de MP)
    MP->>W: POST /api/v1/webhooks/mercadopago (x-signature con la clave del panel)
    W->>W: Valida la firma (si no, 401)
    W->>MP: GET /v1/payments/{data.id}
    MP-->>W: estado, monto y external_reference reales
    W->>DB: confirmar_pago() (service_role)
    W-->>MP: 200 (500 si falla: MP reintenta)
  and Vuelta al sitio (back_url)
    MP-->>P: Redirige a /workshops/[slug]/inscripcion/resultado?inscripcion=id
    P->>W: GET resultado
    W->>DB: Lee la inscripción
    alt Sigue pendiente (el webhook no llegó o llega tarde)
      W->>MP: GET /v1/payments/search?external_reference=id
      MP-->>W: Pagos de la inscripción
      W->>DB: confirmar_pago() por cada pago
    end
    W-->>P: Reservada · Pendiente (se refresca) · Rechazada · Vencida
  end
```

El webhook y la página usan la misma función (`lib/pagos/conciliar.ts`). Si llegan los dos, el segundo no cambia nada: `confirmar_pago` es idempotente.

**Por qué hace falta la conciliación:** el webhook solo llega a producción. Los previews de Vercel están protegidos con Vercel Authentication, y en `localhost` MP no puede llegar. Con la conciliación, el flujo funciona en local, en los previews y si el webhook se demora. En `localhost` la preferencia tampoco lleva `auto_return`, porque MP no lo acepta sin https.

## El webhook se configura en el panel, no en la preferencia

La URL del webhook (`https://<producción>/api/v1/webhooks/mercadopago`, evento **Pagos**) se carga en **Tus integraciones → tu aplicación → Webhooks**, y la clave secreta que muestra ese panel es `MP_WEBHOOK_SECRET`. La preferencia **no** manda `notification_url`.

**Por qué:**
- En producción, los avisos que llegaban por la `notification_url` de la preferencia (con `?data.id=…&type=payment&source_news=webhooks`) daban **401 SignatureMismatch**.
- La "Simular notificación" del panel, con la misma clave, validaba bien (200).
- Es decir: esos avisos no se podían validar con la clave del panel, y el webhook no puede aceptar avisos sin firma válida.
- Sin `notification_url`, MP manda los avisos a la URL del panel, firmados con su clave.

El diagnóstico está en [errores.md](errores.md#401-del-webhook-con-los-pagos-reales).

**Si cambia el dominio de producción,** hay que actualizar la URL en el panel: ya no sale de `NEXT_PUBLIC_SITE_URL`.

## Qué credenciales se usan en cada etapa

| Etapa | `MP_ACCESS_TOKEN` | Webhook y `MP_WEBHOOK_SECRET` |
|---|---|---|
| **Ahora (pruebas)** | Las credenciales **de producción** (`APP_USR-…`) de la aplicación "Home-Bakery2", creada **dentro de la cuenta vendedora de prueba**. No cobran plata real | El webhook de esa aplicación, en **Modo productivo**, solo el evento Pagos, y su clave secreta |
| **Al publicar** | Las credenciales de producción de la **cuenta real de Maggie**, de una aplicación creada en su cuenta | Un webhook **propio** configurado en esa aplicación, con **su propia clave secreta**. La de la vendedora de prueba deja de servir |

**No se usan las credenciales de prueba (`TEST-…`):** con ellas, la firma de los avisos de los pagos del sandbox no validaba (401 SignatureMismatch). Ver [errores.md](errores.md#401-del-webhook-con-las-credenciales-test).

Al pasar a la cuenta de Maggie hay que cambiar **las dos** variables en Vercel a la vez: un token de una aplicación con la clave del webhook de otra da 401. Los pasos de prueba están en [pruebas-mercadopago.md](pruebas-mercadopago.md#configuración-que-funciona).

TODO: crear la aplicación en la cuenta de Maggie y configurar su webhook antes de publicar.

## Estados

| Inscripción | Cuándo | Ocupa lugar |
|---|---|---|
| `pendiente_sena` | Recién inscripta, esperando el pago | Sí, hasta `vence_at` (30 minutos) |
| `pendiente_sena` vencida | Pasaron los 30 minutos sin pago aprobado | **No:** `lugares_ocupados()` deja de contarla sola, sin un proceso que la cancele |
| `reservada` | Pago aprobado, con el monto exacto y con cupo | Sí |
| `cancelada` | La canceló la admin, falló Mercado Pago al crear la preferencia, o el pago llegó sin cupo | No |

Cada pago de MP es una fila de `pagos`, única por `mp_payment_id`, con su estado: `pending`, `in_process`, `approved`, `rejected`, `cancelled` o `refunded`. Los estados de MP que no están en la lista se traducen en `lib/pagos/estados.ts`:
- `authorized` → `pending`;
- `in_mediation` → `in_process`;
- `charged_back` → `refunded`.

### Qué hace `confirmar_pago`

Bloquea la inscripción y el workshop (`for update`), registra o actualiza el pago (`on conflict (mp_payment_id)`) y, si el pago está `approved`:

| Situación | Resultado |
|---|---|
| Ya estaba reservada | Nada (aviso repetido) |
| El monto o la moneda no son los de la inscripción | Sigue pendiente; el pago queda **para devolver** (`monto_distinto`) |
| Hay lugar, aunque haya vencido | **Reservada** |
| Venció y ya no hay lugar | **Cancelada**; el pago queda **para devolver** (`sin_cupo`) |
| La inscripción estaba cancelada | Nada; el pago queda **para devolver** (`inscripcion_cancelada`) |

Los pagos para devolver aparecen en "Para devolver" (en el inicio del panel y en `/admin/inscripciones`). La devolución se hace a mano desde Mercado Pago y después se marca en el panel con **"Marcar como devuelto"**:
- `marcar_devuelto(pago_id)` (migración 0005) exige `es_admin()`, apaga `devolucion_pendiente` y guarda `devuelto_at` y `devuelto_por`. La admin sigue sin poder escribir `pagos` directamente: solo puede marcar la devolución.
- Si después MP repite el aviso de ese pago, `confirmar_pago` (recreada en la 0005) no lo vuelve a marcar "para devolver": un pago con `devuelto_at` queda devuelto.

### Idempotencia y concurrencia

- **El mismo aviso varias veces** (MP reintenta, o llegan el webhook y la conciliación juntos): la fila del pago se actualiza y la inscripción no cambia de nuevo. Lo prueba el e2e de tres avisos simultáneos.
- **Dos pagos por el último lugar:** el bloqueo del workshop los atiende de a uno. El primero reserva y el segundo encuentra el cupo lleno, así que se cancela y queda para devolver.
- **Mismo orden de bloqueo** que `crear_inscripcion` y `cambiar_estado_inscripcion` (el workshop), así no hay deadlocks.

## Decisiones

- **El monto lo calcula la base.** `crear_inscripcion` calcula `monto_sena = round(precio × cantidad × sena_porcentaje / 100, 2)`, y es lo que va a la preferencia. El navegador solo muestra la misma cuenta (`lib/sena.ts`, con tests; con el 100%, es el total); nunca la manda. Al confirmar, se compara el monto que cobró MP con el de la base.
- **No se confía en lo que manda MP sin verificar:**
  - el webhook usa del aviso solo el id y consulta el pago a la API;
  - la página de resultado ignora los query params (`status`, `payment_id`…) y lee la base.
- **Sin efectivo ni cajero:** la preferencia excluye `ticket` y `atm`. Rapipago o Pago Fácil se acreditan en días, cuando el lugar ya se habría liberado.
- **Sin precio no hay inscripción:** un workshop con `precio = null` responde 422 "Precio a confirmar, consultanos por WhatsApp" (`HB422`). Hoy todos los workshops reales están así hasta que Maggie cargue los precios.
- **Vencimiento de 30 minutos:** la preferencia vence a la misma hora que la reserva (`expiration_date_to = vence_at`).
- **Si Mercado Pago falla** al crear la preferencia, la inscripción se cancela (para liberar el cupo ya) y la API responde 502.
- **La secret key en el servidor:** `crear_inscripcion` (desde la 0004) y `confirmar_pago` solo los puede ejecutar `service_role`. La API, el webhook y la página de resultado usan `SUPABASE_SECRET_KEY`, nunca en el navegador. Ver [seguridad](seguridad.md#pagos).

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `MP_ACCESS_TOKEN` | Servidor (Vercel y `.env.local`) | Crear preferencias y consultar pagos. Siempre de producción (`APP_USR-…`): ver [cada etapa](#qué-credenciales-se-usan-en-cada-etapa) |
| `MP_WEBHOOK_SECRET` | Servidor | Validar la firma de los webhooks: la clave del panel (Tus integraciones → Webhooks → Modo productivo), de la misma aplicación que el token. Se usa con `trim()` |
| `NEXT_PUBLIC_SITE_URL` | Producción | URL pública para las `back_urls`. Sin ella: `https://$VERCEL_URL` o `http://localhost:3000`. La URL del webhook va en el panel de MP |
| `SUPABASE_SECRET_KEY` | Servidor | `confirmar_pago` y la página de resultado |

## Tests

- **Unitarios** (`e2e/pagos-unit.spec.ts`): firma, monto, preferencia, estados, URL del sitio, `.ics`, rate limiter y la vista del resultado.
- **Integración** (`e2e/pagos.spec.ts`), contra Supabase y un **mock de la API de MP** (`e2e/support/mp-mock.ts`), que Playwright levanta como segundo servidor. `lib/mercadopago.ts` apunta el SDK al mock con `MP_API_BASE_URL` y solo acepta localhost, así el token nunca sale hacia otro host. Los e2e no usan credenciales reales.
- **Manual en sandbox:** [`docs/pruebas-mercadopago.md`](pruebas-mercadopago.md).
