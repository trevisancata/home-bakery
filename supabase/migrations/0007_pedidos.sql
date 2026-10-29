-- Home Bakery · pedidos de la tienda: carrito, pago completo y confirmación de Maggie.
-- Se corre una vez en el SQL Editor, después de 0006 y ANTES de deployar el
-- código que la usa. Ver docs/modelo-de-datos.md y docs/pagos.md.
--
-- Las reglas (horarios, anticipación, envío) están en data/site.ts → pedidos.
-- La base repite los números para no depender del cliente: si cambian,
-- se cambian en los dos lados.

-- ---------------------------------------------------------------- pedidos
-- Un pedido pagado NO está confirmado: Maggie lo acepta o lo rechaza.
-- pendiente_pago → pagado → aceptado → en_preparacion → listo → entregado,
-- o rechazado / cancelado. Sin pago, vence a los 30 minutos (como las
-- inscripciones); vencido, sigue en pendiente_pago y no se muestra como
-- activo.
create table public.pedidos (
  id              uuid primary key default gen_random_uuid(),
  -- Número corto para hablar por WhatsApp ("Pedido #123").
  numero          bigint generated always as identity unique,
  nombre          text not null check (char_length(nombre) between 2 and 100),
  email           text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono        text not null check (telefono ~ '^[0-9 ()+-]{8,30}$'),
  entrega         text not null check (entrega in ('retiro', 'envio')),
  direccion       text check (char_length(direccion) <= 200),
  localidad       text check (char_length(localidad) <= 80),
  fecha           date not null,
  franja          text not null check (franja in ('9-13', '10-13', '13-16', '16-19')),
  notas           text check (char_length(notas) <= 500),
  total           numeric(12, 2) not null check (total >= 0),
  estado          text not null default 'pendiente_pago'
                  check (estado in ('pendiente_pago', 'pagado', 'aceptado', 'en_preparacion',
                                    'listo', 'entregado', 'rechazado', 'cancelado')),
  vence_at        timestamptz not null default (now() + interval '30 minutes'),
  mp_preference_id text,
  mp_init_point   text,
  aceptado_at     timestamptz,
  rechazado_at    timestamptz,
  motivo_rechazo  text check (char_length(motivo_rechazo) <= 500),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Con envío, la dirección va completa (Maggie valida la distancia al aceptar).
  constraint pedidos_envio_con_direccion check (
    entrega = 'retiro'
    or (char_length(trim(coalesce(direccion, ''))) > 0 and char_length(trim(coalesce(localidad, ''))) > 0)
  )
);

-- Snapshot de lo que se compró: si después cambia el precio o se borra el
-- producto, el pedido sigue diciendo lo mismo (por eso "set null").
create table public.pedido_items (
  id               uuid primary key default gen_random_uuid(),
  pedido_id        uuid not null references public.pedidos (id) on delete cascade,
  producto_id      uuid references public.productos (id) on delete set null,
  tamano_id        uuid references public.producto_tamanos (id) on delete set null,
  nombre           text not null,
  tamano_etiqueta  text not null,
  sabor            text,
  decoracion       text,
  cantidad         integer not null check (cantidad between 1 and 20),
  precio_unitario  numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal         numeric(12, 2) not null check (subtotal >= 0),
  created_at       timestamptz not null default now()
);

create index pedidos_estado_fecha_idx    on public.pedidos (estado, fecha);
create index pedidos_created_idx         on public.pedidos (created_at desc);
create index pedido_items_pedido_idx     on public.pedido_items (pedido_id);
create index pedido_items_producto_idx   on public.pedido_items (producto_id);
create index pedido_items_tamano_idx     on public.pedido_items (tamano_id);
create trigger set_updated_at before update on public.pedidos
  for each row execute function public.set_updated_at();

-- Nadie anónimo lee pedidos (tienen datos personales). La admin los lee;
-- nadie los escribe directo: solo crear_pedido (service_role),
-- confirmar_pago (service_role) y aceptar/rechazar_pedido (admin).
alter table public.pedidos      enable row level security;
alter table public.pedido_items enable row level security;
revoke all on public.pedidos, public.pedido_items from anon, authenticated;
grant select on public.pedidos, public.pedido_items to authenticated;
create policy "Admin lee los pedidos" on public.pedidos
  for select to authenticated using ((select public.es_admin()));
create policy "Admin lee los ítems de los pedidos" on public.pedido_items
  for select to authenticated using ((select public.es_admin()));

-- ---------------------------------------------------------------- pagos
-- Un pago es de una inscripción o de un pedido: exactamente uno de los dos.
alter table public.pagos
  alter column inscripcion_id drop not null,
  add column pedido_id uuid references public.pedidos (id) on delete restrict,
  add constraint pagos_de_uno check (num_nonnulls(inscripcion_id, pedido_id) = 1);

create index pagos_pedido_idx on public.pagos (pedido_id);

alter table public.pagos drop constraint pagos_motivo_devolucion_check;
alter table public.pagos add constraint pagos_motivo_devolucion_check
  check (motivo_devolucion in ('sin_cupo', 'monto_distinto', 'inscripcion_cancelada',
                               'pedido_cancelado', 'pedido_rechazado', 'pago_duplicado'));

-- ---------------------------------------------------------------- crear_pedido
-- Única puerta de entrada para crear pedidos. Solo la ejecuta el servidor
-- (service_role), después de validar el formulario, el Origin y el rate
-- limit. Recalcula TODO desde la base: los precios que mande el cliente no
-- se leen nunca.
-- p_items: [{ "producto_id", "tamano_id", "sabor", "decoracion", "cantidad" }]
-- Errores: HB422 con el campo en "hint" (items, date, slot, delivery) y un
-- mensaje para mostrar · 22xxx/23514 si algo no tiene el formato → 400.
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
  p_items      jsonb
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
  v_vence        timestamptz := now() + interval '30 minutes';
begin
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
    nombre, email, telefono, entrega, direccion, localidad, fecha, franja, notas, total, vence_at
  ) values (
    p_nombre, p_email, p_telefono, p_entrega,
    case when p_entrega = 'envio' then nullif(trim(p_direccion), '') end,
    case when p_entrega = 'envio' then nullif(trim(p_localidad), '') end,
    p_fecha, p_franja, nullif(trim(p_notas), ''), 0, v_vence
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

revoke execute on function public.crear_pedido(text, text, text, text, text, text, date, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.crear_pedido(text, text, text, text, text, text, date, text, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------- confirmar_pago
-- Registra (o actualiza) un pago de MP de una inscripción o de un pedido.
-- Idempotente por mp_payment_id, con la guarda de devuelto_at de 0005.
-- - inscripcion: la lógica de 0003/0005 sin cambios (reserva el lugar).
-- - pedido: approved lo pasa a "pagado" (esperando que Maggie lo acepte),
--   nunca a "aceptado". Un pago de un pedido cancelado o rechazado, con
--   otro monto, o un segundo pago aprobado del mismo pedido, quedan "para
--   devolver".
-- Errores: HB404 (no existe) · HB400 (el pago ya está registrado para otro dueño).
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
      if v_ped.estado in ('cancelado', 'rechazado') then
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

-- La firma vieja (solo inscripciones) queda como envoltorio: entre correr
-- esta migración y deployar el código nuevo, el webhook viejo sigue andando.
-- TODO: borrarla en una migración posterior, cuando el deploy ya esté.
create or replace function public.confirmar_pago(
  p_inscripcion_id  uuid,
  p_mp_payment_id   text,
  p_estado          text,
  p_monto           numeric,
  p_moneda          text,
  p_detalle         jsonb default '{}'::jsonb
)
returns table (estado_inscripcion text, cambio boolean)
language sql
volatile
security definer
set search_path = ''
as $$
  select r.estado, r.cambio
  from public.confirmar_pago('inscripcion', p_inscripcion_id, p_mp_payment_id, p_estado, p_monto, p_moneda, p_detalle) r;
$$;

revoke execute on function public.confirmar_pago(uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirmar_pago(uuid, text, text, numeric, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------- aceptar / rechazar
-- Las usa el panel (PR 2). security definer porque la admin no escribe
-- pedidos ni pagos directo; por eso chequean es_admin() acá adentro, como
-- marcar_devuelto (0005). Bloquean el pedido: un webhook que llega a la vez
-- espera y ve el estado nuevo.
-- Errores: 42501 (sin permiso) · HB404 (no existe) · HB409 (no está en un estado que lo permita).
create or replace function public.aceptar_pedido(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_estado text;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select p.estado into v_estado from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if v_estado <> 'pagado' then
    raise exception 'Solo se puede aceptar un pedido pagado.' using errcode = 'HB409';
  end if;
  update public.pedidos set estado = 'aceptado', aceptado_at = now() where id = p_id;
end;
$$;

-- Rechazar un pedido pagado deja sus pagos "para devolver": la devolución se
-- hace a mano desde Mercado Pago y se marca con marcar_devuelto (0005).
create or replace function public.rechazar_pedido(p_id uuid, p_motivo text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_estado text;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select p.estado into v_estado from public.pedidos p where p.id = p_id for update;
  if not found then
    raise exception 'El pedido no existe.' using errcode = 'HB404';
  end if;
  if v_estado not in ('pendiente_pago', 'pagado') then
    raise exception 'Este pedido ya no se puede rechazar.' using errcode = 'HB409';
  end if;
  update public.pedidos
     set estado = 'rechazado', rechazado_at = now(), motivo_rechazo = nullif(trim(p_motivo), '')
   where id = p_id;
  update public.pagos
     set devolucion_pendiente = true,
         motivo_devolucion = coalesce(motivo_devolucion, 'pedido_rechazado')
   where pedido_id = p_id and estado = 'approved' and devuelto_at is null;
end;
$$;

revoke execute on function public.aceptar_pedido(uuid) from public, anon;
grant execute on function public.aceptar_pedido(uuid) to authenticated;
revoke execute on function public.rechazar_pedido(uuid, text) from public, anon;
grant execute on function public.rechazar_pedido(uuid, text) to authenticated;

-- ---------------------------------------------------------------- service_role
-- Ya los tiene por los "alter default privileges" de 0001; se repiten para
-- que quede explícito.
grant all on public.pedidos, public.pedido_items to service_role;
