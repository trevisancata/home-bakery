-- Home Bakery · medios de pago de los pedidos: Mercado Pago, transferencia y efectivo.
-- Se corre una vez en el SQL Editor, después de 0007 y ANTES de deployar el
-- código que la usa. Ver docs/modelo-de-datos.md y docs/pagos.md.
--
-- Las reglas están en data/site.ts → pedidos.mediosPago; la base repite los
-- números (30 min, 24 h): si cambian, se cambian en los dos lados.
-- En los tres medios Maggie tiene que aceptar el pedido, y el total es el mismo.

-- ---------------------------------------------------------------- pedidos
-- - mercadopago: como en 0007, vence a los 30 minutos sin pago.
-- - transferencia: vence a las 24 h. La admin la marca pagada a mano
--   (marcar_pedido_pagado), aunque haya vencido: la plata puede llegar tarde.
-- - efectivo: solo con retiro, no vence. Maggie puede aceptarlo sin pago y
--   marcarlo pagado cuando lo cobra.
-- El vencimiento se lee (como en las inscripciones): un pedido pendiente_pago
-- con vence_at pasado no se cancela solo, se muestra vencido.
-- pagado_at / pagado_por: quién y cuándo marcó un pago a mano (nunca en MP).
-- devolucion_pendiente / devuelto_at / devuelto_por: devolución manual de una
-- transferencia o un efectivo cobrado (las de MP siguen en pagos).
alter table public.pedidos
  -- El default es para los pedidos que ya existían; los nuevos lo traen de crear_pedido.
  add column medio_pago text not null default 'mercadopago'
    check (medio_pago in ('mercadopago', 'transferencia', 'efectivo')),
  add column pagado_at            timestamptz,
  add column pagado_por           uuid references auth.users (id) on delete set null,
  add column devolucion_pendiente boolean not null default false,
  add column devuelto_at          timestamptz,
  add column devuelto_por         uuid references auth.users (id) on delete set null;

alter table public.pedidos
  alter column vence_at drop not null,
  alter column vence_at drop default,
  add constraint pedidos_efectivo_solo_retiro check (medio_pago <> 'efectivo' or entrega = 'retiro'),
  add constraint pedidos_vence_segun_medio check ((medio_pago = 'efectivo') = (vence_at is null));

create index pedidos_pagado_por_idx   on public.pedidos (pagado_por);
create index pedidos_devuelto_por_idx on public.pedidos (devuelto_por);
create index pedidos_devolucion_idx   on public.pedidos (devolucion_pendiente) where devolucion_pendiente;

-- ---------------------------------------------------------------- crear_pedido
-- La de 0007 con p_medio_pago al final (con default, así el código anterior,
-- que llama con parámetros nombrados, sigue andando hasta el deploy).
-- Errores nuevos: 22023 (medio no válido) · HB422 hint "payment" (efectivo con envío).
drop function public.crear_pedido(text, text, text, text, text, text, date, text, text, jsonb);

create or replace function public.crear_pedido(
  p_nombre     text,
  p_email      text,
  p_telefono   text,
  p_entrega    text,
  p_direccion  text,
  p_localidad  text,
  p_fecha      date,
  p_franja     text,
  p_notas      text,
  p_items      jsonb,
  p_medio_pago text default 'mercadopago'
)
returns table (pedido_id uuid, numero bigint, total numeric, vence_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  -- Ver data/site.ts → pedidos.
  c_zona         constant text    := 'America/Argentina/Buenos_Aires';
  c_max_lineas   constant integer := 30;
  c_max_dias     constant integer := 30;
  c_envio_minimo constant numeric := 400000;
  c_vence_mp_min    constant integer := 30;
  c_vence_transf_h  constant integer := 24;
  v_ahora_ba     timestamp := now() at time zone 'America/Argentina/Buenos_Aires';
  v_mes          integer   := extract(month from now() at time zone 'America/Argentina/Buenos_Aires');
  v_item         jsonb;
  v_prod         public.productos%rowtype;
  v_cat          public.categorias%rowtype;
  v_tam          public.producto_tamanos%rowtype;
  v_sabor        text;
  v_deco         text;
  v_cantidad     integer;
  v_anticipacion integer := 0;
  v_total        numeric(12, 2) := 0;
  v_inicio       timestamptz;
  v_dia          integer;
  v_id           uuid;
  v_numero       bigint;
  v_vence        timestamptz;
begin
  -- Medio de pago: Mercado Pago vence a los 30 min, transferencia a las 24 h
  -- y efectivo no vence. El efectivo es solo con retiro.
  if p_medio_pago is null or p_medio_pago not in ('mercadopago', 'transferencia', 'efectivo') then
    raise exception 'Medio de pago no válido.' using errcode = '22023';
  end if;
  if p_medio_pago = 'efectivo' and p_entrega = 'envio' then
    raise exception 'El efectivo es solo para retiro. Elegí otro medio de pago o retiro.'
      using errcode = 'HB422', hint = 'payment';
  end if;
  v_vence := case p_medio_pago
               when 'mercadopago'   then now() + make_interval(mins => c_vence_mp_min)
               when 'transferencia' then now() + make_interval(hours => c_vence_transf_h)
             end;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > c_max_lineas then
    raise exception 'El pedido tiene que tener entre 1 y % productos.', c_max_lineas
      using errcode = 'HB422', hint = 'items';
  end if;

  -- Fecha y franja: lunes a viernes 10-13, 13-16, 16-19; sábados 9-13; domingos no.
  v_dia := extract(isodow from p_fecha);
  if v_dia = 7 then
    raise exception 'Los domingos no hay retiros ni entregas. Elegí otro día.'
      using errcode = 'HB422', hint = 'date';
  end if;
  if (v_dia = 6 and p_franja is distinct from '9-13')
     or (v_dia < 6 and p_franja not in ('10-13', '13-16', '16-19')) then
    raise exception 'Ese horario no está disponible ese día.'
      using errcode = 'HB422', hint = 'slot';
  end if;
  if p_fecha > v_ahora_ba::date + c_max_dias then
    raise exception 'Podés encargar con hasta % días de anticipación.', c_max_dias
      using errcode = 'HB422', hint = 'date';
  end if;

  insert into public.pedidos (
    nombre, email, telefono, entrega, direccion, localidad, fecha, franja, notas, total, vence_at, medio_pago
  ) values (
    p_nombre, p_email, p_telefono, p_entrega,
    case when p_entrega = 'envio' then nullif(trim(p_direccion), '') end,
    case when p_entrega = 'envio' then nullif(trim(p_localidad), '') end,
    p_fecha, p_franja, nullif(trim(p_notas), ''), 0, v_vence, p_medio_pago
  )
  returning id, numero into v_id, v_numero;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_cantidad := (v_item ->> 'cantidad')::integer;
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 20 then
      raise exception 'La cantidad tiene que ser entre 1 y 20.' using errcode = 'HB422', hint = 'items';
    end if;

    select * into v_prod from public.productos p where p.id = (v_item ->> 'producto_id')::uuid;
    if found then
      select * into v_cat from public.categorias c where c.id = v_prod.categoria_id;
    end if;
    if not found or not v_prod.activo or not v_cat.activo then
      raise exception 'Uno de los productos ya no está disponible.' using errcode = 'HB422', hint = 'items';
    end if;
    if v_prod.a_medida or v_cat.a_medida then
      raise exception '"%" es a medida: consultalo por WhatsApp.', v_prod.nombre using errcode = 'HB422', hint = 'items';
    end if;
    -- Temporada (puede cruzar el año: 9 → 2), con el mes de Buenos Aires.
    if v_prod.temporada_desde_mes is not null and not (
      case when v_prod.temporada_desde_mes <= v_prod.temporada_hasta_mes
           then v_mes between v_prod.temporada_desde_mes and v_prod.temporada_hasta_mes
           else v_mes >= v_prod.temporada_desde_mes or v_mes <= v_prod.temporada_hasta_mes end
    ) then
      raise exception '"%" está fuera de temporada.', v_prod.nombre using errcode = 'HB422', hint = 'items';
    end if;

    select * into v_tam from public.producto_tamanos t
     where t.id = (v_item ->> 'tamano_id')::uuid and t.producto_id = v_prod.id;
    if not found then
      raise exception 'El tamaño elegido de "%" ya no existe.', v_prod.nombre using errcode = 'HB422', hint = 'items';
    end if;
    if v_tam.precio is null then
      raise exception '"%" (%) tiene precio a confirmar: consultalo por WhatsApp.', v_prod.nombre, v_tam.etiqueta
        using errcode = 'HB422', hint = 'items';
    end if;

    -- Sabor: obligatorio si el producto tiene sabores. Decoración: opcional.
    v_sabor := nullif(trim(v_item ->> 'sabor'), '');
    v_deco  := nullif(trim(v_item ->> 'decoracion'), '');
    if (cardinality(v_prod.sabores) > 0 and (v_sabor is null or not v_sabor = any (v_prod.sabores)))
       or (cardinality(v_prod.sabores) = 0 and v_sabor is not null) then
      raise exception 'Elegí un sabor válido para "%".', v_prod.nombre using errcode = 'HB422', hint = 'items';
    end if;
    if v_deco is not null and not v_deco = any (v_prod.decoraciones) then
      raise exception 'Elegí una decoración válida para "%".', v_prod.nombre using errcode = 'HB422', hint = 'items';
    end if;

    v_anticipacion := greatest(v_anticipacion, v_prod.anticipacion_horas);
    v_total := v_total + v_tam.precio * v_cantidad;

    insert into public.pedido_items (
      pedido_id, producto_id, tamano_id, nombre, tamano_etiqueta, sabor, decoracion,
      cantidad, precio_unitario, subtotal
    ) values (
      v_id, v_prod.id, v_tam.id, v_prod.nombre, v_tam.etiqueta, v_sabor, v_deco,
      v_cantidad, v_tam.precio, v_tam.precio * v_cantidad
    );
  end loop;

  if v_total <= 0 then
    raise exception 'El pedido no tiene un total para cobrar.' using errcode = 'HB422', hint = 'items';
  end if;

  -- La anticipación (la mayor de los productos) se cuenta hasta que empieza la franja.
  v_inicio := (p_fecha + make_interval(hours => split_part(p_franja, '-', 1)::integer)) at time zone c_zona;
  if v_inicio < now() + make_interval(hours => v_anticipacion) then
    raise exception 'Necesitamos al menos % h de anticipación: elegí un día o un horario más adelante.', v_anticipacion
      using errcode = 'HB422', hint = 'date';
  end if;

  if p_entrega = 'envio' and v_total < c_envio_minimo then
    raise exception 'El envío es solo para pedidos desde $400.000. Elegí retiro.'
      using errcode = 'HB422', hint = 'delivery';
  end if;

  update public.pedidos p set total = v_total where p.id = v_id;
  return query select v_id, v_numero, v_total::numeric, v_vence;
end;
$$;

revoke execute on function public.crear_pedido(text, text, text, text, text, text, date, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.crear_pedido(text, text, text, text, text, text, date, text, text, jsonb, text)
  to service_role;

-- ---------------------------------------------------------------- confirmar_pago
-- La de 0007 con una guarda: un pago de MP de un pedido por transferencia o
-- en efectivo (no tiene link de pago, no debería llegar) queda "para devolver"
-- y no cambia el estado.
create or replace function public.confirmar_pago(
  p_tipo           text,
  p_id             uuid,
  p_mp_payment_id  text,
  p_estado         text,
  p_monto          numeric,
  p_moneda         text,
  p_detalle        jsonb default '{}'::jsonb
)
returns table (estado text, cambio boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_insc        public.inscripciones%rowtype;
  v_ped         public.pedidos%rowtype;
  v_cupo        integer;
  v_ocupados    integer;
  v_actual      text;
  v_nuevo       text;
  v_preference  text;
  v_devolucion  boolean := false;
  v_motivo      text;
  v_filas       integer;
begin
  if p_tipo = 'inscripcion' then
    select * into v_insc from public.inscripciones i where i.id = p_id for update;
    if not found then
      raise exception 'La inscripción no existe.' using errcode = 'HB404';
    end if;
    select w.cupo into v_cupo from public.workshops w where w.id = v_insc.workshop_id for update;

    v_actual := v_insc.estado;
    v_nuevo := v_insc.estado;
    v_preference := v_insc.mp_preference_id;
    if p_estado = 'approved' and v_insc.estado <> 'reservada' then
      if v_insc.estado = 'cancelada' then
        v_devolucion := true;  v_motivo := 'inscripcion_cancelada';
      elsif p_monto is distinct from v_insc.monto_sena or p_moneda <> 'ARS' then
        v_devolucion := true;  v_motivo := 'monto_distinto';
      else
        -- Lugares de las demás (aunque esta ya haya vencido, se reserva si entra).
        select coalesce(sum(i.cantidad), 0) into v_ocupados
        from public.inscripciones i
        where i.workshop_id = v_insc.workshop_id
          and i.id <> v_insc.id
          and (i.estado = 'reservada' or (i.estado = 'pendiente_sena' and i.vence_at > now()));
        if v_ocupados + v_insc.cantidad <= v_cupo then
          v_nuevo := 'reservada';
        else
          v_nuevo := 'cancelada';  v_devolucion := true;  v_motivo := 'sin_cupo';
        end if;
      end if;
    end if;

  elsif p_tipo = 'pedido' then
    select * into v_ped from public.pedidos p where p.id = p_id for update;
    if not found then
      raise exception 'El pedido no existe.' using errcode = 'HB404';
    end if;

    v_actual := v_ped.estado;
    v_nuevo := v_ped.estado;
    v_preference := v_ped.mp_preference_id;
    if p_estado = 'approved' then
      if v_ped.medio_pago <> 'mercadopago' then
        -- No debería pasar: el pedido se paga por transferencia o en efectivo,
        -- así que no tiene link de pago. Si igual llega uno, se devuelve.
        v_devolucion := true;  v_motivo := 'pago_duplicado';
      elsif v_ped.estado in ('cancelado', 'rechazado') then
        v_devolucion := true;
        v_motivo := case v_ped.estado when 'cancelado' then 'pedido_cancelado' else 'pedido_rechazado' end;
      elsif exists (
        select 1 from public.pagos pg
        where pg.pedido_id = v_ped.id and pg.estado = 'approved'
          and pg.mp_payment_id <> p_mp_payment_id and not pg.devolucion_pendiente and pg.devuelto_at is null
      ) then
        -- Ya hay otro pago aprobado de este pedido: este se devuelve.
        v_devolucion := true;  v_motivo := 'pago_duplicado';
      elsif v_ped.estado = 'pendiente_pago' then
        if p_monto is distinct from v_ped.total or p_moneda <> 'ARS' then
          v_devolucion := true;  v_motivo := 'monto_distinto';
        else
          -- Aunque haya vencido: no hay cupo que cuidar y Maggie lo confirma igual.
          v_nuevo := 'pagado';
        end if;
      end if;
    end if;

  else
    raise exception 'Tipo de pago desconocido.' using errcode = 'HB400';
  end if;

  insert into public.pagos (
    inscripcion_id, pedido_id, mp_preference_id, mp_payment_id, estado, monto, moneda,
    detalle, devolucion_pendiente, motivo_devolucion
  ) values (
    v_insc.id, v_ped.id, v_preference, p_mp_payment_id, p_estado, p_monto, p_moneda,
    coalesce(p_detalle, '{}'::jsonb), v_devolucion, v_motivo
  )
  on conflict (mp_payment_id) do update set
    estado               = excluded.estado,
    monto                = excluded.monto,
    moneda               = excluded.moneda,
    detalle              = excluded.detalle,
    -- Un pago ya devuelto (marcar_devuelto) no vuelve a quedar "para devolver".
    devolucion_pendiente = case when public.pagos.devuelto_at is not null then false
                                else public.pagos.devolucion_pendiente or excluded.devolucion_pendiente end,
    motivo_devolucion    = coalesce(public.pagos.motivo_devolucion, excluded.motivo_devolucion)
  where public.pagos.inscripcion_id is not distinct from excluded.inscripcion_id
    and public.pagos.pedido_id is not distinct from excluded.pedido_id;

  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    raise exception 'El pago pertenece a otra inscripción o pedido.' using errcode = 'HB400';
  end if;

  if v_nuevo <> v_actual then
    if p_tipo = 'inscripcion' then
      update public.inscripciones set estado = v_nuevo where id = p_id;
    else
      update public.pedidos set estado = v_nuevo where id = p_id;
    end if;
  end if;

  return query select v_nuevo, v_nuevo <> v_actual;
end;
$$;

revoke execute on function public.confirmar_pago(text, uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirmar_pago(text, uuid, text, text, numeric, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------- marcar_pedido_pagado
-- La admin registra un pago que no pasó por Mercado Pago. Como aceptar_pedido,
-- chequea es_admin() acá adentro y bloquea el pedido.
-- - transferencia: desde pendiente_pago → pagado, aunque haya vencido (la plata
--   puede llegar tarde; después Maggie decide si lo acepta).
-- - efectivo: guarda quién y cuándo; pasa a pagado solo si estaba
--   pendiente_pago, así marcarlo al entregar no hace retroceder un pedido aceptado.
-- - mercadopago: no se marca a mano (lo registra el webhook).
-- Errores: 42501 · HB404 · HB409.
create or replace function public.marcar_pedido_pagado(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ped public.pedidos%rowtype;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select * into v_ped from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if v_ped.medio_pago = 'mercadopago' then
    raise exception 'Los pagos de Mercado Pago se registran solos.' using errcode = 'HB409';
  end if;
  if v_ped.estado in ('rechazado', 'cancelado') or v_ped.pagado_at is not null then
    raise exception 'Este pedido ya no se puede marcar como pagado.' using errcode = 'HB409';
  end if;
  if v_ped.medio_pago = 'transferencia' and v_ped.estado <> 'pendiente_pago' then
    raise exception 'Este pedido ya no se puede marcar como pagado.' using errcode = 'HB409';
  end if;

  update public.pedidos
     set pagado_at = now(),
         pagado_por = (select auth.uid()),
         estado = case when estado = 'pendiente_pago' then 'pagado' else estado end
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------- aceptar / rechazar
-- aceptar: un pedido pagado, o uno en efectivo sin pagar (se cobra al retirar).
-- Una transferencia o un MP sin pagar no se pueden aceptar.
create or replace function public.aceptar_pedido(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ped public.pedidos%rowtype;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select * into v_ped from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if not (v_ped.estado = 'pagado' or (v_ped.medio_pago = 'efectivo' and v_ped.estado = 'pendiente_pago')) then
    raise exception 'Solo se puede aceptar un pedido pagado.' using errcode = 'HB409';
  end if;
  update public.pedidos set estado = 'aceptado', aceptado_at = now() where id = p_id;
end;
$$;

-- rechazar: como en 0007. Si el pago se había marcado a mano (transferencia o
-- efectivo), el pedido queda "para devolver"; los pagos de MP, en pagos.
create or replace function public.rechazar_pedido(p_id uuid, p_motivo text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ped public.pedidos%rowtype;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select * into v_ped from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if v_ped.estado not in ('pendiente_pago', 'pagado') then
    raise exception 'Este pedido ya no se puede rechazar.' using errcode = 'HB409';
  end if;
  update public.pedidos
     set estado = 'rechazado', rechazado_at = now(), motivo_rechazo = nullif(trim(p_motivo), ''),
         devolucion_pendiente = pagado_at is not null
   where id = p_id;
  update public.pagos
     set devolucion_pendiente = true,
         motivo_devolucion = coalesce(motivo_devolucion, 'pedido_rechazado')
   where pedido_id = p_id and estado = 'approved' and devuelto_at is null;
end;
$$;

-- ---------------------------------------------------------------- marcar_pedido_devuelto
-- Como marcar_devuelto (0005), para la devolución manual de un pago que no
-- fue por MP: la admin marca que ya devolvió la plata.
create or replace function public.marcar_pedido_devuelto(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  update public.pedidos
     set devolucion_pendiente = false, devuelto_at = now(), devuelto_por = (select auth.uid())
   where id = p_id and devolucion_pendiente;
  if not found then
    raise exception 'El pedido no existe o no está para devolver.' using errcode = 'HB404';
  end if;
end;
$$;

revoke execute on function public.marcar_pedido_pagado(uuid) from public, anon;
grant execute on function public.marcar_pedido_pagado(uuid) to authenticated;
revoke execute on function public.marcar_pedido_devuelto(uuid) from public, anon;
grant execute on function public.marcar_pedido_devuelto(uuid) to authenticated;
-- aceptar/rechazar mantienen la firma: los grants de 0007 siguen valiendo.
