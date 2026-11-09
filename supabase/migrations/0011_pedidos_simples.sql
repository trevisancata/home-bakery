-- Home Bakery · pedidos simples: un pedido en curso se entrega en un paso.
-- Se corre una vez en el SQL Editor, después de 0010 y ANTES de deployar el
-- código que la usa (el código anterior sigue funcionando: los pasos viejos
-- se siguen aceptando). Ver docs/modelo-de-datos.md (Transiciones de un pedido).

-- ---------------------------------------------------------------- avanzar_pedido
-- aceptado, en_preparacion o listo → entregado, en un solo paso.
-- en_preparacion y listo siguen en el check de pedidos.estado por los pedidos
-- que ya están en esos estados; el panel ya no ofrece pasar a ellos. Los pasos
-- aceptado → en_preparacion → listo se siguen aceptando solo para que el
-- código deployado antes de esta migración no falle.
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
  v_ped     public.pedidos%rowtype;
  v_permite boolean;
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

  v_permite := case p_estado
                 when 'entregado'      then v_ped.estado in ('aceptado', 'en_preparacion', 'listo')
                 when 'en_preparacion' then v_ped.estado = 'aceptado'
                 when 'listo'          then v_ped.estado = 'en_preparacion'
               end;
  if not v_permite then
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

-- cancelar_pedido (0009) no cambia: sigue cancelando aceptado, en_preparacion o listo.

revoke execute on function public.avanzar_pedido(uuid, text, boolean) from public, anon;
grant execute on function public.avanzar_pedido(uuid, text, boolean) to authenticated;
