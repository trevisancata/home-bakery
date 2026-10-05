-- Home Bakery · E4: catálogo, workshops e inscripciones.
-- Se corre una vez en el SQL Editor de Supabase. Ver docs/modelo-de-datos.md.

-- ---------------------------------------------------------------- utilidades
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- catálogo
create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  orden       integer not null default 0,
  a_medida    boolean not null default false,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.productos (
  id                   uuid primary key default gen_random_uuid(),
  categoria_id         uuid not null references public.categorias (id) on delete restrict,
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre               text not null check (char_length(nombre) between 1 and 120),
  descripcion          text,
  medida               text,
  porciones            text,
  peso                 text,
  presentacion         text,
  temporada_desde_mes  smallint check (temporada_desde_mes between 1 and 12),
  temporada_hasta_mes  smallint check (temporada_hasta_mes between 1 and 12),
  a_medida             boolean not null default false,
  anticipacion_horas   integer not null default 48 check (anticipacion_horas >= 0),
  activo               boolean not null default true,
  destacado            boolean not null default false,
  orden                integer not null default 0,
  sabores              text[] not null default '{}',
  decoraciones         text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- La temporada va completa o no va (puede cruzar el año: 9 → 2).
  constraint productos_temporada_completa
    check ((temporada_desde_mes is null) = (temporada_hasta_mes is null))
);

create table public.producto_tamanos (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos (id) on delete cascade,
  etiqueta     text not null check (char_length(etiqueta) between 1 and 80),
  precio       numeric(12, 2) check (precio >= 0),  -- null = "Precio a confirmar"
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (producto_id, etiqueta)
);

create table public.producto_imagenes (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos (id) on delete cascade,
  ruta         text not null,          -- dentro del bucket "productos": <slug>/<archivo>.webp
  alt          text not null,
  sabor        text,
  ancho        integer not null check (ancho > 0),
  alto         integer not null check (alto > 0),
  portada      boolean not null default false,
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (producto_id, ruta)
);

-- ---------------------------------------------------------------- workshops
create table public.workshops (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre           text not null check (char_length(nombre) between 1 and 120),
  resumen          text,
  descripcion      text,
  nivel            text check (nivel in ('Inicial', 'Intermedio')),
  incluye          text,
  fecha_inicio     timestamptz not null,
  duracion_min     integer not null default 120 check (duracion_min > 0),
  precio           numeric(12, 2) check (precio >= 0),  -- null = "Precio a confirmar"
  sena_porcentaje  integer not null default 50 check (sena_porcentaje between 1 and 100),
  cupo             integer not null default 8 check (cupo between 1 and 8),
  cupo_minimo      integer not null default 4,
  activo           boolean not null default true,
  destacado        boolean not null default false,
  -- Fechas de ejemplo (data/workshops.ts) hasta que Maggie cargue las reales:
  -- se muestran con aviso y no aceptan inscripciones.
  es_ejemplo       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint workshops_cupo_minimo check (cupo_minimo between 1 and cupo)
);

create table public.workshop_imagenes (
  id           uuid primary key default gen_random_uuid(),
  workshop_id  uuid not null references public.workshops (id) on delete cascade,
  ruta         text not null,          -- dentro del bucket "workshops"
  alt          text not null,
  ancho        integer not null check (ancho > 0),
  alto         integer not null check (alto > 0),
  portada      boolean not null default false,
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workshop_id, ruta)
);

-- Una inscripción es un registro de una persona: borrar un workshop con
-- inscripciones tiene que fallar (restrict), no borrarlas en cascada.
create table public.inscripciones (
  id                uuid primary key default gen_random_uuid(),
  workshop_id       uuid not null references public.workshops (id) on delete restrict,
  nombre            text not null check (char_length(nombre) between 2 and 100),
  whatsapp          text not null check (whatsapp ~ '^[0-9 ()+-]{8,30}$'),
  email             text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  experiencia       text check (char_length(experiencia) <= 40),
  alergias          text check (char_length(alergias) <= 500),
  como_nos_conocio  text check (char_length(como_nos_conocio) <= 60),
  cantidad          integer not null check (cantidad between 1 and 8),
  acepta_politica   boolean not null check (acepta_politica),
  estado            text not null default 'pendiente_sena'
                    check (estado in ('pendiente_sena', 'reservada', 'cancelada')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------- índices (FK y filtros)
create index productos_categoria_idx         on public.productos (categoria_id, orden) where activo;
create index productos_destacados_idx        on public.productos (orden) where activo and destacado;
create index producto_tamanos_producto_idx   on public.producto_tamanos (producto_id, orden);
create index producto_imagenes_producto_idx  on public.producto_imagenes (producto_id, orden);
create unique index producto_imagenes_una_portada on public.producto_imagenes (producto_id) where portada;
create index workshops_proximos_idx          on public.workshops (fecha_inicio) where activo;
create index workshop_imagenes_workshop_idx  on public.workshop_imagenes (workshop_id, orden);
create unique index workshop_imagenes_una_portada on public.workshop_imagenes (workshop_id) where portada;
create index inscripciones_workshop_idx      on public.inscripciones (workshop_id) where estado <> 'cancelada';
create index inscripciones_workshop_fk_idx   on public.inscripciones (workshop_id);

-- ---------------------------------------------------------------- updated_at
create trigger set_updated_at before update on public.categorias        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.productos         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.producto_tamanos  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.producto_imagenes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workshops         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workshop_imagenes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inscripciones     for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- permisos y RLS
-- Supabase da todos los privilegios a anon/authenticated por defecto: se
-- revocan y se otorga solo lectura donde hace falta. RLS filtra las filas.
revoke all on public.categorias, public.productos, public.producto_tamanos, public.producto_imagenes,
              public.workshops, public.workshop_imagenes, public.inscripciones
  from anon, authenticated;
grant select on public.categorias, public.productos, public.producto_tamanos, public.producto_imagenes,
                public.workshops, public.workshop_imagenes
  to anon, authenticated;

alter table public.categorias        enable row level security;
alter table public.productos         enable row level security;
alter table public.producto_tamanos  enable row level security;
alter table public.producto_imagenes enable row level security;
alter table public.workshops         enable row level security;
alter table public.workshop_imagenes enable row level security;
alter table public.inscripciones     enable row level security;

create policy "Lectura pública de categorías activas" on public.categorias
  for select to anon, authenticated using (activo);

create policy "Lectura pública de productos activos" on public.productos
  for select to anon, authenticated
  using (activo and exists (select 1 from public.categorias c where c.id = categoria_id and c.activo));

create policy "Lectura pública de tamaños de productos activos" on public.producto_tamanos
  for select to anon, authenticated
  using (exists (select 1 from public.productos p where p.id = producto_id and p.activo));

create policy "Lectura pública de imágenes de productos activos" on public.producto_imagenes
  for select to anon, authenticated
  using (exists (select 1 from public.productos p where p.id = producto_id and p.activo));

create policy "Lectura pública de workshops activos" on public.workshops
  for select to anon, authenticated using (activo);

create policy "Lectura pública de imágenes de workshops activos" on public.workshop_imagenes
  for select to anon, authenticated
  using (exists (select 1 from public.workshops w where w.id = workshop_id and w.activo));

-- inscripciones: RLS activo y sin políticas ni grants → nadie las lee ni las
-- escribe con la clave publishable. Se crean solo con crear_inscripcion().
-- TODO(E5): políticas de escritura para la admin (authenticated + rol admin).

-- ---------------------------------------------------------------- cupo
-- Lugares ocupados de un workshop. Es security definer porque anon no puede
-- leer inscripciones: devuelve solo el total, nunca datos de las personas.
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
    and i.estado <> 'cancelada';
$$;

revoke execute on function public.lugares_ocupados(uuid) from public, anon, authenticated;
grant execute on function public.lugares_ocupados(uuid) to anon, authenticated;

-- Próximos workshops con lugares libres. security_invoker: respeta el RLS de
-- workshops (solo activos) de quien consulta.
create view public.workshops_publicos
with (security_invoker = true) as
select
  w.id, w.slug, w.nombre, w.resumen, w.descripcion, w.nivel, w.incluye,
  w.fecha_inicio, w.duracion_min, w.precio, w.sena_porcentaje,
  w.cupo, w.cupo_minimo, w.destacado, w.es_ejemplo,
  greatest(w.cupo - public.lugares_ocupados(w.id), 0) as lugares_libres
from public.workshops w
where w.activo
  and w.fecha_inicio > now();

grant select on public.workshops_publicos to anon, authenticated;

-- ---------------------------------------------------------------- inscripción
-- Única puerta de entrada para crear inscripciones. Todo pasa en una sola
-- transacción: bloquea la fila del workshop (for update), así dos personas
-- que se inscriben a la vez se atienden de a una y no hay sobreventa.
-- Errores: HB404 (no existe, inactivo, de ejemplo o ya empezó) · HB409 (sin cupo, con
-- los lugares libres en "detail") · 23514 (no pasa un check) → 400 en la API.
create or replace function public.crear_inscripcion(
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
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_workshop  public.workshops%rowtype;
  v_libres    integer;
  v_id        uuid;
begin
  select * into v_workshop
  from public.workshops w
  where w.slug = p_workshop_slug
  for update;

  -- Los workshops de ejemplo no aceptan inscripciones (los de prueba e2e se
  -- crean con es_ejemplo = false).
  if not found or not v_workshop.activo or v_workshop.es_ejemplo
     or v_workshop.fecha_inicio <= now() then
    raise exception 'El workshop no existe o ya no tiene inscripción abierta.'
      using errcode = 'HB404';
  end if;

  v_libres := greatest(v_workshop.cupo - public.lugares_ocupados(v_workshop.id), 0);

  if p_cantidad is null or p_cantidad > v_libres then
    raise exception 'No quedan lugares suficientes.'
      using errcode = 'HB409', detail = v_libres::text;
  end if;

  insert into public.inscripciones (
    workshop_id, nombre, whatsapp, email, cantidad, acepta_politica,
    experiencia, alergias, como_nos_conocio
  ) values (
    v_workshop.id, p_nombre, p_whatsapp, p_email, p_cantidad, p_acepta_politica,
    p_experiencia, p_alergias, p_como_nos_conocio
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  from public, anon, authenticated;
grant execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------- storage
-- Buckets públicos: las fotos se sirven por URL pública sin pasar por RLS.
-- No hay políticas de insert/update/delete en storage.objects: solo la
-- secret key (seed) puede subir. TODO(E5): políticas de subida para la admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('productos', 'productos', true, 5242880,  array['image/webp', 'image/jpeg', 'image/png']),
  ('workshops', 'workshops', true, 52428800, array['image/webp', 'image/jpeg', 'image/png', 'video/mp4'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------- service_role
-- El proyecto tiene desactivado "Automatically expose new tables": la secret
-- key (service_role, usada por el seed y los tests) necesita permisos
-- explícitos, también para las tablas y funciones que se creen después.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
