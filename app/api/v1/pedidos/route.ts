import { BadGatewayError, BadRequestError, ForbiddenError, fromDbError, TooManyRequestsError } from "@/lib/admin/errors";
import { ok, readJson, sameOrigin, withApi } from "@/lib/api";
import { crearPreferencia } from "@/lib/mercadopago";
import { armarPreferenciaPedido } from "@/lib/pagos/preferencia";
import { clientIp, pedidosLimiter } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { pedidoSchema } from "@/lib/validation/pedido";

type PedidoCreado = { pedido_id: string; numero: number; total: number | string; vence_at: string };

type ItemRow = {
  producto_id: string | null;
  nombre: string;
  tamano_etiqueta: string;
  sabor: string | null;
  cantidad: number;
  precio_unitario: number | string;
};

/** Campos que crear_pedido puede marcar en el "hint" de un HB422. */
const camposDeLaBase = new Set(["items", "date", "slot", "delivery"]);

/**
 * POST /api/v1/pedidos: crea el pedido de la tienda y la preferencia de pago
 * en Mercado Pago (el total).
 *
 * 1. Solo desde este sitio (Origin), con el esquema del checkout y el rate limit.
 * 2. crear_pedido (Supabase, solo service_role) valida productos, tamaños,
 *    sabores, fecha, franja y envío, y calcula los precios desde la base:
 *    lo que mande el cliente no se lee.
 * 3. Con los ítems y el total que guardó la base, se crea la preferencia.
 *
 * Pagar no confirma el pedido: queda "pagado" hasta que Maggie lo acepta.
 *
 * 201 { data: { id, numero, initPoint } } · 400 { error: { message, fields } } ·
 * 403 si viene de otro sitio · 429 · 502 si falla MP · 500
 */
export const POST = withApi("Error al guardar el pedido", async (request) => {
  if (!sameOrigin(request)) throw new ForbiddenError("El pedido no viene del sitio.");
  const pedido = pedidoSchema.parse(await readJson(request));

  // Se cuentan solo los pedidos válidos: corregir un error del formulario no gasta intentos.
  const ip = clientIp(request.headers);
  const minutes = pedidosLimiter.blockedMinutes(ip);
  if (minutes !== null) {
    throw new TooManyRequestsError(
      `Hiciste varios pedidos seguidos. Probá de nuevo en ${minutes === 1 ? "1 minuto" : `${minutes} minutos`}.`,
      minutes * 60,
    );
  }
  pedidosLimiter.hit(ip);

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("crear_pedido", {
      p_nombre: pedido.name,
      p_email: pedido.email,
      p_telefono: pedido.phone,
      p_entrega: pedido.delivery,
      p_direccion: pedido.address ?? null,
      p_localidad: pedido.locality ?? null,
      p_fecha: pedido.date,
      p_franja: pedido.slot,
      p_notas: pedido.notes ?? null,
      p_items: pedido.items.map((item) => ({
        producto_id: item.productId,
        tamano_id: item.sizeId,
        sabor: item.flavor ?? null,
        decoracion: item.decoration ?? null,
        cantidad: item.quantity,
      })),
    })
    .single<PedidoCreado>();
  if (error) {
    // HB422: una regla del pedido (producto no disponible, fecha, envío…),
    // con el campo en el hint y un mensaje pensado para mostrar.
    if (error.code === "HB422" && error.hint && camposDeLaBase.has(error.hint)) {
      throw new BadRequestError(error.message, { [error.hint]: error.message });
    }
    throw fromDbError(error, "El pedido no se pudo crear.");
  }

  const id = data.pedido_id;
  const numero = Number(data.numero);

  let preferencia: { id: string; initPoint: string };
  try {
    const items = await admin
      .from("pedido_items")
      .select("producto_id, nombre, tamano_etiqueta, sabor, cantidad, precio_unitario")
      .eq("pedido_id", id)
      .order("created_at");
    if (items.error) throw Object.assign(new Error("No se pudieron leer los ítems"), { code: items.error.code });
    preferencia = await crearPreferencia(
      armarPreferenciaPedido({
        pedido: { id, numero, email: pedido.email, venceAt: data.vence_at },
        items: (items.data as ItemRow[]).map((item) => ({
          productoId: item.producto_id,
          nombre: item.nombre,
          tamano: item.tamano_etiqueta,
          sabor: item.sabor,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precio_unitario),
        })),
        baseUrl: siteUrl(),
      }),
    );
  } catch (mpError) {
    // Sin link de pago el pedido no sirve: se cancela.
    const status = typeof mpError === "object" && mpError && "status" in mpError ? String(mpError.status) : "sin status";
    console.error(`Error al crear la preferencia de Mercado Pago del pedido (${status})`);
    await admin.from("pedidos").update({ estado: "cancelado" }).eq("id", id);
    throw new BadGatewayError("No pudimos iniciar el pago. Probá de nuevo en un rato.");
  }

  // Para reintentar el pago desde la página de resultado.
  const { error: updateError } = await admin
    .from("pedidos")
    .update({ mp_preference_id: preferencia.id, mp_init_point: preferencia.initPoint })
    .eq("id", id);
  if (updateError) console.error(`No se pudo guardar la preferencia del pedido (${updateError.code})`);

  return ok({ id, numero, initPoint: preferencia.initPoint }, { status: 201, cache: false });
});
