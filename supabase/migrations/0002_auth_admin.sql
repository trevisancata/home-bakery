-- Home Bakery · E5: perfiles, roles (RBAC) y escritura para la admin.
-- Se corre una vez en el SQL Editor, después de 0001. Ver docs/seguridad.md.

-- ---------------------------------------------------------------- perfiles
-- Un perfil por usuaria de Auth. Sin perfil = sin rol (puede ingresar, pero
-- recibe 403). 'editor' queda reservado: hoy no tiene permisos de escritura.
create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text check (char_length(nombre) between 1 and 80),
  rol         text not null check (rol in ('admin', 'editor')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at before update on public.perfiles
  for each row execute function public.set_updated_at();

alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;

create policy "Cada usuaria lee su perfil" on public.perfiles
  for select to authenticated using (id = (select auth.uid()));
-- Sin políticas de escritura: nadie cambia roles con la clave publishable
-- (ni siquiera la admin). Se asignan con el SQL del final o la secret key.

-- ---------------------------------------------------------------- es_admin
-- security definer: lee perfiles sin depender de sus políticas (y evita
-- recursión si una política de perfiles la usara). stable: se evalúa una vez
-- por consulta cuando va envuelta en (select ...).
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid()) and p.rol = 'admin'
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------- catálogo y workshops
-- Las políticas permisivas se combinan con OR: la admin ve todo (también lo
-- inactivo) y el público sigue viendo solo lo activo (políticas de 0001).
grant insert, update, delete on
  public.categorias, public.productos, public.producto_tamanos,
  public.producto_imagenes, public.workshops, public.workshop_imagenes
  to authenticated;

do $$
declare t text;
begin
  foreach t in array array['categorias', 'productos', 'producto_tamanos',
                           'producto_imagenes', 'workshops', 'workshop_imagenes']
  loop
    execute format('create policy "Admin lee todo" on public.%I for select to authenticated using ((select public.es_admin()))', t);
    execute format('create policy "Admin crea" on public.%I for insert to authenticated with check ((select public.es_admin()))', t);
    execute format('create policy "Admin edita" on public.%I for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))', t);
    execute format('create policy "Admin borra" on public.%I for delete to authenticated using ((select public.es_admin()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- inscripciones
-- La admin lee las inscripciones y cambia solo la columna estado. No hay
-- delete: una inscripción se cancela, no se borra.
grant select on public.inscripciones to authenticated;
grant update (estado) on public.inscripciones to authenticated;

create policy "Admin lee inscripciones" on public.inscripciones
  for select to authenticated using ((select public.es_admin()));
create policy "Admin cambia el estado" on public.inscripciones
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Volver a activar una inscripción cancelada vuelve a ocupar lugares: se
-- hace con el mismo bloqueo que crear_inscripcion para no sobrevender.
-- security invoker: corre con los permisos (y el RLS) de la admin.
-- Errores: HB404 (no existe o no es visible) · HB409 (sin cupo, libres en detail).
create or replace function public.cambiar_estado_inscripcion(p_id uuid, p_estado text)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_insc    public.inscripciones%rowtype;
  v_libres  integer;
begin
  -- Bloquea la inscripción (dos cambios a la vez no leen un estado viejo) y
  -- después el workshop (igual que crear_inscripcion).
  select * into v_insc from public.inscripciones i where i.id = p_id for update;
  if not found then
    raise exception 'La inscripción no existe.' using errcode = 'HB404';
  end if;

  perform 1 from public.workshops w where w.id = v_insc.workshop_id for update;

  if v_insc.estado = 'cancelada' and p_estado <> 'cancelada' then
    v_libres := greatest(
      (select w.cupo from public.workshops w where w.id = v_insc.workshop_id)
        - public.lugares_ocupados(v_insc.workshop_id), 0);
    if v_insc.cantidad > v_libres then
      raise exception 'No quedan lugares suficientes.'
        using errcode = 'HB409', detail = v_libres::text;
    end if;
  end if;

  update public.inscripciones set estado = p_estado where id = p_id;
end;
$$;

revoke execute on function public.cambiar_estado_inscripcion(uuid, text) from public, anon;
grant execute on function public.cambiar_estado_inscripcion(uuid, text) to authenticated;

-- ---------------------------------------------------------------- tamaños
-- Reemplaza los tamaños de un producto en una sola transacción (borra e
-- inserta). security invoker: aplica el RLS de la admin.
create or replace function public.reemplazar_tamanos(p_producto_id uuid, p_tamanos jsonb)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  delete from public.producto_tamanos where producto_id = p_producto_id;
  insert into public.producto_tamanos (producto_id, etiqueta, precio, orden)
  select p_producto_id, t.etiqueta, t.precio, t.orden
  from jsonb_to_recordset(p_tamanos) as t(etiqueta text, precio numeric, orden integer);
end;
$$;

revoke execute on function public.reemplazar_tamanos(uuid, jsonb) from public, anon;
grant execute on function public.reemplazar_tamanos(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------- storage
-- Los buckets siguen públicos para leer por URL. Subir, reemplazar y borrar,
-- solo la admin. Storage también pide select para update/delete.
create policy "Admin ve las fotos" on storage.objects
  for select to authenticated
  using (bucket_id in ('productos', 'workshops') and (select public.es_admin()));
create policy "Admin sube fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('productos', 'workshops') and (select public.es_admin()));
create policy "Admin reemplaza fotos" on storage.objects
  for update to authenticated
  using (bucket_id in ('productos', 'workshops') and (select public.es_admin()))
  with check (bucket_id in ('productos', 'workshops') and (select public.es_admin()));
create policy "Admin borra fotos" on storage.objects
  for delete to authenticated
  using (bucket_id in ('productos', 'workshops') and (select public.es_admin()));

-- service_role recibe permisos sobre perfiles y las funciones nuevas por los
-- "alter default privileges" de 0001.

-- ---------------------------------------------------------------- asignar admin
-- 1. Crear la usuaria en Authentication → Users → Add user (con "Auto Confirm").
-- 2. Correr, con su email:
-- insert into public.perfiles (id, nombre, rol)
-- select id, null, 'admin' from auth.users where email = '<email-de-la-admin>'
-- on conflict (id) do update set rol = excluded.rol;
