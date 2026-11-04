-- Home Bakery · panel de pedidos: avanzar un pedido aceptado y cancelarlo.
-- Se corre una vez en el SQL Editor, después de 0008 y ANTES de deployar el
-- código que la usa. Ver docs/modelo-de-datos.md (Transiciones de un pedido).

-- ---------------------------------------------------------------- pedidos
-- Cuándo pasó a cada estado, para el historial del panel (aceptado_at y
-- rechazado_at ya estaban desde 0007). La cancelación lleva motivo, como el rechazo.
alter table public.pedidos
  add column en_preparacion_at  timestamptz,
  add column listo_at           timestamptz,
  add column entregado_at       timestamptz,
  add column cancelado_at       timestamptz,
  add column motivo_cancelacion text check (char_length(motivo_cancelacion) <= 500);

-- ---------------------------------------------------------------- avanzar_pedido
-- aceptado → en_preparacion → listo → entregado, de a un paso: no se puede
-- saltear ni volver atrás. Como aceptar_pedido, chequea es_admin() adentro y
-- bloquea el pedido.
-- Efectivo: entregarlo sin haberlo cobrado (pagado_at) pide p_cobrado = true,
-- que guarda el cobro en la misma transacción (lo que el panel muestra como
-- "Entregado y cobrado").
-- Errores: 42501 · HB404 · 22023 (estado desconocido) · HB409 (transición no permitida).
create or replace function public.avanzar_pedido(p_id uuid, p_estado text, p_cobrado boolean default false)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ped       public.pedidos%rowtype;
  v_siguiente text;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  if p_estado is null or p_estado not in ('en_preparacion', 'listo', 'entregado') then
    raise exception 'Estado no válido.' using errcode = '22023';
  end if;
  select * into v_ped from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;

  v_siguiente := case v_ped.estado
                   when 'aceptado'       then 'en_preparacion'
                   when 'en_preparacion' then 'listo'
                   when 'listo'          then 'entregado'
                 end;
  if v_siguiente is null or v_siguiente <> p_estado then
    raise exception 'El pedido no puede pasar a ese estado desde el actual.' using errcode = 'HB409';
  end if;
  if p_estado = 'entregado' and v_ped.medio_pago = 'efectivo' and v_ped.pagado_at is null and not coalesce(p_cobrado, false) then
    raise exception 'Marcá que lo cobraste antes de entregarlo.' using errcode = 'HB409';
  end if;

  update public.pedidos
     set estado            = p_estado,
         en_preparacion_at = case when p_estado = 'en_preparacion' then now() else en_preparacion_at end,
         listo_at          = case when p_estado = 'listo' then now() else listo_at end,
         entregado_at      = case when p_estado = 'entregado' then now() else entregado_at end,
         pagado_at         = case when p_estado = 'entregado' and medio_pago = 'efectivo' and pagado_at is null
                                  then now() else pagado_at end,
         pagado_por        = case when p_estado = 'entregado' and medio_pago = 'efectivo' and pagado_at is null
                                  then (select auth.uid()) else pagado_por end
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------- cancelar_pedido
-- Un pedido ya aceptado (aceptado, en_preparacion o listo) se cancela con
-- motivo: la clienta avisó que no puede, o a Maggie se le complicó. Si estaba
-- pagado queda para devolver, igual que al rechazar: los pagos de MP en pagos
-- (pedido_cancelado, ya en el check de 0007) y un pago marcado a mano
-- (pagado_at) en pedidos.devolucion_pendiente. Para pagado o pendiente_pago
-- está rechazar_pedido; entregado no se cancela.
-- Errores: 42501 · HB404 · 22023 (sin motivo) · HB409.
create or replace function public.cancelar_pedido(p_id uuid, p_motivo text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ped    public.pedidos%rowtype;
  v_motivo text := nullif(trim(p_motivo), '');
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  if v_motivo is null or char_length(v_motivo) < 3 or char_length(v_motivo) > 500 then
    raise exception 'Escribí el motivo de la cancelación.' using errcode = '22023';
  end if;
  select * into v_ped from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if v_ped.estado not in ('aceptado', 'en_preparacion', 'listo') then
    raise exception 'Este pedido ya no se puede cancelar.' using errcode = 'HB409';
  end if;

  update public.pedidos
     set estado = 'cancelado', cancelado_at = now(), motivo_cancelacion = v_motivo,
         devolucion_pendiente = pagado_at is not null
   where id = p_id;
  update public.pagos
     set devolucion_pendiente = true,
         motivo_devolucion = coalesce(motivo_devolucion, 'pedido_cancelado')
   where pedido_id = p_id and estado = 'approved' and devuelto_at is null;
end;
$$;

revoke execute on function public.avanzar_pedido(uuid, text, boolean) from public, anon;
grant execute on function public.avanzar_pedido(uuid, text, boolean) to authenticated;
revoke execute on function public.cancelar_pedido(uuid, text) from public, anon;
grant execute on function public.cancelar_pedido(uuid, text) to authenticated;
