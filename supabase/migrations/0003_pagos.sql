-- Home Bakery · E6: seña de los workshops con Mercado Pago.
-- Se corre una vez en el SQL Editor, después de 0001 y 0002. Ver docs/pagos.md.

-- ---------------------------------------------------------------- inscripciones
-- monto_sena lo calcula siempre la base (crear_inscripcion). Una pendiente
-- vence a los 30 minutos y deja de ocupar lugar sola (lugares_ocupados).
alter table public.inscripciones
  add column monto_sena       numeric(12, 2) check (monto_sena >= 0),
  add column vence_at         timestamptz not null default (now() + interval '30 minutes'),
  add column mp_preference_id text,
  add column mp_init_point    text;

-- ---------------------------------------------------------------- pagos
create table public.pagos (
  id                    uuid primary key default gen_random_uuid(),
  inscripcion_id        uuid not null references public.inscripciones (id) on delete restrict,
  mp_preference_id      text,
  mp_payment_id         text not null unique,
  estado                text not null check (estado in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
  monto                 numeric(12, 2) not null check (monto >= 0),
  moneda                text not null check (moneda ~ '^[A-Z]{3}$'),
  -- Solo datos del pago (status_detail, medio, fechas), nunca datos personales.
  detalle               jsonb not null default '{}'::jsonb,
  -- Para devolver a mano desde Mercado Pago (se lista en /admin).
  devolucion_pendiente  boolean not null default false,
  motivo_devolucion     text check (motivo_devolucion in ('sin_cupo', 'monto_distinto', 'inscripcion_cancelada')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index pagos_inscripcion_idx on public.pagos (inscripcion_id);
create index pagos_devolucion_idx  on public.pagos (created_at) where devolucion_pendiente;
create trigger set_updated_at before update on public.pagos
  for each row execute function public.set_updated_at();

alter table public.pagos enable row level security;
revoke all on public.pagos from anon, authenticated;
grant select on public.pagos to authenticated;
create policy "Admin lee los pagos" on public.pagos
  for select to authenticated using ((select public.es_admin()));
-- Sin políticas de escritura: los pagos los escribe solo confirmar_pago
-- (service_role, desde el webhook y la conciliación).

-- ---------------------------------------------------------------- cupo
-- Ocupan lugar las reservadas y las pendientes de seña que no vencieron.
create or replace function public.lugares_ocupados(p_workshop_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(i.cantidad), 0)::integer
  from public.inscripciones i
  where i.workshop_id = p_workshop_id
    and (i.estado = 'reservada' or (i.estado = 'pendiente_sena' and i.vence_at > now()));
$$;

-- ---------------------------------------------------------------- crear_inscripcion
-- Cambia lo que devuelve (ahora una fila con la seña), así que se borra y se
-- vuelve a crear. HB422: el workshop no tiene precio.
drop function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text);

create function public.crear_inscripcion(
  p_workshop_slug     text,
  p_nombre            text,
  p_whatsapp          text,
  p_email             text,
  p_cantidad          integer,
  p_acepta_politica   boolean,
  p_experiencia       text default null,
  p_alergias          text default null,
  p_como_nos_conocio  text default null
)
returns table (
  inscripcion_id   uuid,
  monto_sena       numeric,
  vence_at         timestamptz,
  workshop_nombre  text,
  sena_porcentaje  integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_workshop  public.workshops%rowtype;
  v_libres    integer;
  v_monto     numeric(12, 2);
  v_vence     timestamptz := now() + interval '30 minutes';
  v_id        uuid;
begin
  select * into v_workshop
  from public.workshops w
  where w.slug = p_workshop_slug
  for update;

  if not found or not v_workshop.activo or v_workshop.es_ejemplo
     or v_workshop.fecha_inicio <= now() then
    raise exception 'El workshop no existe o ya no tiene inscripción abierta.'
      using errcode = 'HB404';
  end if;

  if v_workshop.precio is null then
    raise exception 'Precio a confirmar.' using errcode = 'HB422';
  end if;

  v_libres := greatest(v_workshop.cupo - public.lugares_ocupados(v_workshop.id), 0);
  if p_cantidad is null or p_cantidad > v_libres then
    raise exception 'No quedan lugares suficientes.'
      using errcode = 'HB409', detail = v_libres::text;
  end if;

  -- Seña = precio × cantidad × porcentaje / 100, redondeada al centavo.
  v_monto := round(v_workshop.precio * p_cantidad * v_workshop.sena_porcentaje / 100.0, 2);

  insert into public.inscripciones (
    workshop_id, nombre, whatsapp, email, cantidad, acepta_politica,
    experiencia, alergias, como_nos_conocio, monto_sena, vence_at
  ) values (
    v_workshop.id, p_nombre, p_whatsapp, p_email, p_cantidad, p_acepta_politica,
    p_experiencia, p_alergias, p_como_nos_conocio, v_monto, v_vence
  )
  returning id into v_id;

  return query select v_id, v_monto, v_vence, v_workshop.nombre, v_workshop.sena_porcentaje;
end;
$$;

revoke execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  from public, anon, authenticated;
grant execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------- confirmar_pago
-- Registra (o actualiza) un pago de MP y, si corresponde, reserva el lugar.
-- Idempotente: el mismo mp_payment_id se puede recibir muchas veces (webhook
-- duplicado, webhook + conciliación). Bloquea la inscripción y el workshop,
-- así dos pagos por el último lugar se atienden de a uno.
-- Lo llama solo el servidor con la secret key (service_role).
create or replace function public.confirmar_pago(
  p_inscripcion_id  uuid,
  p_mp_payment_id   text,
  p_estado          text,
  p_monto           numeric,
  p_moneda          text,
  p_detalle         jsonb default '{}'::jsonb
)
returns table (estado_inscripcion text, cambio boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_insc        public.inscripciones%rowtype;
  v_cupo        integer;
  v_ocupados    integer;
  v_nuevo       text;
  v_devolucion  boolean := false;
  v_motivo      text;
  v_filas       integer;
begin
  select * into v_insc from public.inscripciones i where i.id = p_inscripcion_id for update;
  if not found then
    raise exception 'La inscripción no existe.' using errcode = 'HB404';
  end if;
  select w.cupo into v_cupo from public.workshops w where w.id = v_insc.workshop_id for update;

  v_nuevo := v_insc.estado;
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

  insert into public.pagos (
    inscripcion_id, mp_preference_id, mp_payment_id, estado, monto, moneda,
    detalle, devolucion_pendiente, motivo_devolucion
  ) values (
    v_insc.id, v_insc.mp_preference_id, p_mp_payment_id, p_estado, p_monto, p_moneda,
    coalesce(p_detalle, '{}'::jsonb), v_devolucion, v_motivo
  )
  on conflict (mp_payment_id) do update set
    estado               = excluded.estado,
    monto                = excluded.monto,
    moneda               = excluded.moneda,
    detalle              = excluded.detalle,
    devolucion_pendiente = public.pagos.devolucion_pendiente or excluded.devolucion_pendiente,
    motivo_devolucion    = coalesce(public.pagos.motivo_devolucion, excluded.motivo_devolucion)
  where public.pagos.inscripcion_id = excluded.inscripcion_id;

  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    raise exception 'El pago pertenece a otra inscripción.' using errcode = 'HB400';
  end if;

  if v_nuevo <> v_insc.estado then
    update public.inscripciones set estado = v_nuevo where id = v_insc.id;
  end if;

  return query select v_nuevo, v_nuevo <> v_insc.estado;
end;
$$;

revoke execute on function public.confirmar_pago(uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirmar_pago(uuid, text, text, numeric, text, jsonb)
  to service_role;

-- service_role ya tiene permisos sobre las tablas nuevas por los
-- "alter default privileges" de 0001; se repiten para que quede explícito.
grant all on public.pagos to service_role;
