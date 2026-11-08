-- Home Bakery · "Así fueron los workshops" desde la base.
-- Se corre una vez en el SQL Editor, después de 0009 y ANTES de deployar el
-- código que la usa. Ver docs/modelo-de-datos.md (Foto de cómo fue).

-- ---------------------------------------------------------------- foto de recuerdo
-- Una foto por workshop, separada de las de promoción (workshop_imagenes):
-- dos columnas alcanzan y la estructura ya asegura que haya una sola. El
-- archivo va al bucket "workshops", en la carpeta del slug.
alter table public.workshops
  add column foto_recuerdo_ruta text,
  add column foto_recuerdo_alt  text,
  add constraint workshops_foto_recuerdo check (
    (foto_recuerdo_ruta is null and foto_recuerdo_alt is null)
    or (foto_recuerdo_ruta is not null and char_length(btrim(foto_recuerdo_alt)) between 1 and 200)
  );

-- ---------------------------------------------------------------- poner y quitar
-- Solo la admin, y solo en workshops que ya pasaron y no son de ejemplo.
-- Devuelven la ruta anterior para que el servidor borre ese archivo.
-- Errores: 42501 · HB404 · HB409 (todavía no pasó o es de ejemplo).
create or replace function public.poner_foto_recuerdo(p_workshop_id uuid, p_ruta text, p_alt text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ws public.workshops%rowtype;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select * into v_ws from public.workshops w where w.id = p_workshop_id for update;
  if not found then
    raise exception 'El workshop no existe.' using errcode = 'HB404';
  end if;
  if v_ws.es_ejemplo or v_ws.fecha_inicio > now() then
    raise exception 'Solo los workshops que ya pasaron llevan foto de cómo fue.' using errcode = 'HB409';
  end if;

  update public.workshops
     set foto_recuerdo_ruta = p_ruta, foto_recuerdo_alt = btrim(p_alt)
   where id = p_workshop_id;
  return v_ws.foto_recuerdo_ruta;
end;
$$;

create or replace function public.quitar_foto_recuerdo(p_workshop_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ruta text;
begin
  if not (select public.es_admin()) then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select w.foto_recuerdo_ruta into v_ruta from public.workshops w where w.id = p_workshop_id for update;
  if not found then
    raise exception 'El workshop no existe.' using errcode = 'HB404';
  end if;

  update public.workshops
     set foto_recuerdo_ruta = null, foto_recuerdo_alt = null
   where id = p_workshop_id;
  return v_ruta;
end;
$$;

revoke execute on function public.poner_foto_recuerdo(uuid, text, text) from public, anon;
grant execute on function public.poner_foto_recuerdo(uuid, text, text) to authenticated;
revoke execute on function public.quitar_foto_recuerdo(uuid) from public, anon;
grant execute on function public.quitar_foto_recuerdo(uuid) to authenticated;

-- ---------------------------------------------------------------- lectura pública
-- Para "Así fueron los workshops". security definer porque los pasados están
-- inactivos y el RLS de workshops no se los muestra a anon. Devuelve solo
-- nombre, fecha y foto: nada de inscripciones ni de precios. Es una función
-- y no una vista security definer (que el linter de Supabase marca), y así
-- el tope llega como parámetro.
create or replace function public.workshops_pasados(p_limite integer)
returns table (nombre text, fecha_inicio timestamptz, foto_ruta text, foto_alt text)
language sql
stable
security definer
set search_path = ''
as $$
  select w.nombre, w.fecha_inicio, w.foto_recuerdo_ruta, w.foto_recuerdo_alt
  from public.workshops w
  where w.fecha_inicio < now()
    and not w.es_ejemplo
    and w.foto_recuerdo_ruta is not null
  order by w.fecha_inicio desc, w.nombre
  limit least(greatest(coalesce(p_limite, 0), 0), 50);
$$;

revoke execute on function public.workshops_pasados(integer) from public;
grant execute on function public.workshops_pasados(integer) to anon, authenticated;

-- ---------------------------------------------------------------- workshops que ya se hicieron
-- La lista de Maggie (27/10, antes en data/site.ts). Fechas aproximadas: el
-- día 15 de cada mes (TODO(Maggie): confirmar, docs/contenido-maggie.md).
-- Inactivos, sin precio y en el pasado: no se pueden vender. cupo y
-- cupo_minimo quedan en el default porque la tabla no los deja en null.
-- El slug lleva el mes, así no choca si Maggie repite el workshop.
-- Idempotente: si ya existe el slug, no se toca.
insert into public.workshops (slug, nombre, fecha_inicio, precio, activo, es_ejemplo)
values
  ('postres-en-shot-2026-10',                    'Postres en shot',                     '2026-10-15 12:00:00-03', null, false, false),
  ('pasteleria-para-el-te-vol-2-2026-09',        'Pastelería para el té VOL. 2',        '2026-09-15 12:00:00-03', null, false, false),
  ('mis-tortas-basicas-2026-08',                 'Mis tortas básicas',                  '2026-08-15 12:00:00-03', null, false, false),
  ('disena-tu-propia-number-cake-2026-07',       'Diseñá tu propia number cake',        '2026-07-15 12:00:00-03', null, false, false),
  ('pasteleria-para-adolescentes-2026-07',       'Pastelería para adolescentes',        '2026-07-15 12:00:00-03', null, false, false),
  ('pasteleria-para-el-te-2026-06',              'Pastelería para el té',               '2026-06-15 12:00:00-03', null, false, false),
  ('pasteleria-sin-azucar-y-sin-harina-2026-05', 'Pastelería sin azúcar & sin harina',  '2026-05-15 12:00:00-03', null, false, false),
  ('meriendas-y-snacks-2026-04',                 'Meriendas & snacks',                  '2026-04-15 12:00:00-03', null, false, false),
  ('postres-sin-harina-2026-03',                 'Postres sin harina',                  '2026-03-15 12:00:00-03', null, false, false)
on conflict (slug) do nothing;
