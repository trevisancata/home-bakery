# Prueba manual del pago en sandbox

Paso a paso para probar el pago de la inscripción con las cuentas y las tarjetas de prueba de Mercado Pago. Los tests automáticos usan un mock de la API (ver [pagos.md](pagos.md#tests)); esta prueba es la que confirma que la integración real funciona.

Datos de prueba según la [documentación de compras de prueba de Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-purchases). Revisala antes de probar, porque Mercado Pago a veces cambia las tarjetas.

## Configuración que funciona

> **Con credenciales `TEST-…` el webhook da 401.** La firma `x-signature` de los avisos de pagos reales del sandbox no valida con esas credenciales (SignatureMismatch), aunque la clave secreta esté bien. Ver [errores.md](errores.md#401-del-webhook-con-las-credenciales-test).

La que se verificó el 22/10/2026 (aviso `payment.created` entregado con 200 y pago conciliado):

1. **Aplicación dentro de la cuenta vendedora de prueba:** ingresar a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) **con la cuenta vendedora de prueba** (no con la cuenta real) y crear ahí la aplicación de Checkout Pro. La nuestra se llama "Home-Bakery2".
2. **Credenciales de producción de esa aplicación:** en **Tu aplicación → Credenciales de producción**, el Access Token (`APP_USR-…`) va como `MP_ACCESS_TOKEN`. Como la aplicación es de una cuenta de prueba, no cobra plata real.
3. **Webhook en "Modo productivo":** en **Tu aplicación → Webhooks → Configurar notificaciones**, pestaña **Modo productivo**, la URL `https://<dominio de producción>/api/v1/webhooks/mercadopago` y **solo** el evento **Pagos**. Guardar y copiar **la clave secreta de ese modo** como `MP_WEBHOOK_SECRET` en Vercel.
4. **Pagar con la cuenta compradora de prueba en una ventana de incógnito** (ver los [casos](#3-casos)).

El detalle de cada paso está en [Preparar](#1-preparar-una-sola-vez).

## 1. Preparar (una sola vez)

1. **Cuentas de prueba:** en **Tu aplicación → Cuentas de prueba** (de la aplicación de la cuenta real), crear una cuenta **vendedora** y una **compradora** (país: Argentina). Anotar el usuario y la contraseña de las dos, y el código de 6 dígitos que pide al ingresar.
2. **Aplicación:** ingresar a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) con la cuenta **vendedora de prueba** y crear una aplicación de Checkout Pro (o usar la existente, "Home-Bakery2").
3. **Credenciales:** el Access Token **de producción** (`APP_USR-…`) de esa aplicación va como `MP_ACCESS_TOKEN`. **No** el de prueba (`TEST-…`): con ese, el webhook da 401.
   - en `.env.local`, para probar en local;
   - en Vercel, en el entorno donde se pruebe.
4. **Webhook** (solo producción: los previews están protegidos con Vercel Authentication y el aviso no les llega):
   - en **Tu aplicación → Webhooks → Configurar notificaciones**, en **Modo productivo**, poner la URL `https://<dominio de producción>/api/v1/webhooks/mercadopago` y solo el evento **Pagos**;
   - guardar y copiar la **clave secreta** de ese modo como `MP_WEBHOOK_SECRET` en Vercel.
5. **URL pública:** `NEXT_PUBLIC_SITE_URL` con la URL de producción, para las `back_urls`. En local, sin https, MP no acepta `auto_return`: la vuelta al sitio es con el botón "Volver al sitio", y el pago se confirma por conciliación. La URL del webhook **no** va en la preferencia, solo en el panel (paso 4; ver [pagos.md](pagos.md#el-webhook-se-configura-en-el-panel-no-en-la-preferencia)).
6. **Workshop de prueba:** desde Supabase o `PATCH /api/v1/admin/workshops/<id>`, un workshop **activo**, con **precio**, **no de ejemplo** y con fecha futura. Por ejemplo, $ 1.000: se paga el total, $ 1.000 por lugar.

> Probá siempre en una **ventana de incógnito**, con la sesión de la cuenta compradora de prueba. Si usás tu cuenta real, MP rechaza el pago o mezcla las credenciales.

## 2. Tarjetas de prueba (Argentina)

| Tarjeta | Número | CVV | Vencimiento |
|---|---|---|---|
| Mastercard crédito | 5031 7557 3453 0604 | 123 | 11/30 |
| Visa crédito | 4509 9535 6623 3704 | 123 | 11/30 |
| American Express | 3711 803032 57522 | 1234 | 11/30 |
| Mastercard débito | 5287 3383 1025 3304 | 123 | 11/30 |
| Visa débito | 4002 7686 9439 5619 | 123 | 11/30 |

El **nombre del titular** decide el resultado. Documento: DNI 12345678.

| Titular | Resultado |
|---|---|
| `APRO` | Aprobado |
| `OTHE` | Rechazado (error general) |
| `CONT` | Pendiente |
| `FUND` | Rechazado (fondos insuficientes) |
| `SECU` | Rechazado (código de seguridad) |

## 3. Casos

Para cada caso: inscribirse en el workshop de prueba (`/workshops/<slug>/inscripcion`), pasar a "Revisá y pagá", tocar **"Pagar con Mercado Pago"** e ingresar con la cuenta compradora de prueba.

### Aprobado (`APRO`)

1. Pagar con una tarjeta y titular `APRO`.
2. **Tiene que pasar:**
   - MP vuelve solo a `/workshops/<slug>/inscripcion/resultado?inscripcion=<id>` (en producción, por `auto_return`) con **"¡Tu lugar está reservado!"**;
   - se muestra el total pagado;
   - "Agregar al calendario" descarga el `.ics`.
3. **Dónde verlo:**
   - **`/admin`:** la inscripción en "Reservada" y el pago "Aprobado", con el id de MP.
   - **Supabase:** en `inscripciones`, `estado = 'reservada'`; en `pagos`, una fila `approved` con el `monto` igual a `monto_sena`.
   - **`/workshops`:** los lugares libres bajaron.
   - **MP (Tu aplicación → Webhooks → historial de notificaciones):** el aviso de pago con respuesta 200. Solo en producción.

### Rechazado (`OTHE`)

1. Pagar con titular `OTHE`, y en MP volver al sitio.
2. **Tiene que pasar:** **"El pago no se aprobó"** y el botón **"Probar de nuevo"**, que lleva otra vez a Checkout Pro, mientras no pasen los 30 minutos.
3. **Dónde verlo:** en `pagos`, una fila `rejected`; la inscripción sigue `pendiente_sena`. En `/admin`: "Pendiente de pago · Rechazado".
4. **Reintento:** "Probar de nuevo" y pagar con `APRO` → reservada. En `pagos` quedan las dos filas.

### Pendiente (`CONT`)

1. Pagar con titular `CONT`.
2. **Tiene que pasar:** **"Estamos esperando la confirmación del pago"**. La página se refresca cada 5 segundos durante 1 minuto y después muestra "Todavía no se confirmó…".
3. **Dónde verlo:** en `pagos`, una fila `in_process` o `pending`. Si después MP lo aprueba, el webhook (o abrir de nuevo la página de resultado) lo pasa a reservada.

### Vencimiento

1. Inscribirse y **no pagar**.
2. A los 30 minutos (o cambiando `vence_at` a una hora pasada en Supabase), `/workshops` vuelve a mostrar el lugar libre, y la página de resultado dice **"La reserva venció"**.
3. Si se intenta pagar con el link viejo, MP avisa que la preferencia venció.

### Pago que llega sin cupo

1. Con un workshop de cupo 1: la persona A se inscribe y no paga.
2. Se cambia su `vence_at` al pasado; la persona B se inscribe y paga con `APRO` (reservada).
3. A paga con `APRO` usando el link que todavía tenía abierto (si la preferencia no venció).
4. **Tiene que pasar:**
   - A ve **"El pago llegó cuando ya no quedaban lugares"**;
   - en `/admin` aparece en **"Para devolver"** con el motivo "Llegó sin cupo";
   - la devolución se hace a mano desde la cuenta de MP.

### Preview de Vercel (sin webhook)

En un preview, el aviso de MP no llega (Vercel Authentication). La página de resultado concilia sola: al volver de MP busca los pagos de la inscripción en la API y la reserva igual. Si se cierra la pestaña antes de volver, el pago queda registrado recién cuando se abre la página de resultado; en producción lo registra el webhook.

## 4. Si algo no anda

| Síntoma | Qué revisar |
|---|---|
| 502 "No pudimos iniciar el pago" | `MP_ACCESS_TOKEN` cargado y válido. En los logs de Vercel: "Error al crear la preferencia de Mercado Pago (<status>)" |
| 401 en el historial de webhooks de MP | Que `MP_ACCESS_TOKEN` sea el de **producción** (`APP_USR-…`) de la aplicación de la vendedora de prueba, no el `TEST-…`. Que `MP_WEBHOOK_SECRET` sea la clave del **Modo productivo** de esa misma aplicación. En los logs de Vercel: "Webhook de Mercado Pago con firma inválida (<motivo>) · x-request-id=…"; con el `x-request-id` se encuentra el aviso en el historial de MP |
| Queda "Estamos esperando…" con el pago aprobado en MP | Que el `external_reference` del pago sea el id de la inscripción, y que `SUPABASE_SECRET_KEY` esté en el servidor |
| "Algo salió mal" al volver de MP en local | Es esperable en `localhost`: MP no acepta back_urls locales para `auto_return`. Volver con el botón del checkout |
