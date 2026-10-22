-- Home Bakery · E5 (panel): marcar como devueltos los pagos que había que devolver.
-- Se corre una vez en el SQL Editor, después de 0004. Ver docs/pagos.md.

-- ---------------------------------------------------------------- pagos
alter table public.pagos
  add column devuelto_at  timestamptz,
  add column devuelto_por uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------- marcar_devuelto
-- La admin no escribe pagos directamente: solo puede marcar que ya devolvió
-- (a mano, desde Mercado Pago) un pago que estaba "para devolver". Queda
-- registrado cuándo y quién.
create or replace function public.marcar_devuelto(p_pago_id uuid)
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
  update public.pagos
     set devolucion_pendiente = false, devuelto_at = now(), devuelto_por = (select auth.uid())
   where id = p_pago_id and devolucion_pendiente;
  if not found then
    raise exception 'El pago no existe o ya no está para devolver.' using errcode = 'HB404';
  end if;
end;
$$;

revoke execute on function public.marcar_devuelto(uuid) from public, anon;
grant execute on function public.marcar_devuelto(uuid) to authenticated;

-- ---------------------------------------------------------------- confirmar_pago
-- La misma función de 0003, con un solo cambio en el "on conflict": si el
-- pago ya se devolvió, un aviso repetido de MP no lo vuelve a marcar.
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
    -- Un pago ya devuelto (marcar_devuelto) no vuelve a quedar "para devolver".
    devolucion_pendiente = case when public.pagos.devuelto_at is not null then false
                                else public.pagos.devolucion_pendiente or excluded.devolucion_pendiente end,
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
