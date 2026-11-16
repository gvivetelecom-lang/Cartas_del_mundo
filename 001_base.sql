-- Cartas del Mundo: esquema inicial para Supabase (plan Free)
-- Cómo usarlo: en Supabase, SQL Editor -> New query -> pegar todo -> Run.
-- Se puede correr en un proyecto vacío. Es un primer borrador: revisar antes de usar con datos reales.

create extension if not exists pgcrypto;

-- ============================================================
-- Administradora
-- ============================================================
create or replace function es_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'ancorvalan.a@gmail.com';
$$;

-- ============================================================
-- Suscriptoras: una fila por cuenta (se crea al entrar con el enlace)
-- La suscripción es gratuita y se pide por correo (Gmail). El estado lo cambia
-- solo la administradora al confirmar el pedido. La usuaria no puede cambiarlo.
-- Estados: sin_suscripcion -> pendiente (pedido enviado) -> activa -> cancelada.
-- ============================================================
create table if not exists suscriptoras (
  user_id uuid primary key references auth.users(id) on delete cascade,
  correo text not null,
  estado text not null default 'sin_suscripcion'
    check (estado in ('sin_suscripcion', 'pendiente', 'activa', 'cancelada')),
  edad_adulta boolean not null default false,
  tutor_correo text,
  tutor_consentimiento boolean not null default false,
  acepto_terminos boolean not null default false,
  alta timestamptz not null default now()
);

-- ============================================================
-- Cartas diarias. Se escriben desde la tarea programada con clave secreta.
-- Antes de las 11:00 (hora de Brasil) la página muestra la carta de ayer;
-- ese corte lo hace el sitio, no la base.
-- ============================================================
create table if not exists cartas (
  fecha date primary key,
  items jsonb not null check (jsonb_array_length(items) = 12),
  creada timestamptz not null default now()
);

-- ============================================================
-- Manifiestos publicados (solo los aprobados por Anita)
-- ============================================================
create table if not exists manifiestos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autora text,
  anonimo boolean not null default true,
  texto text not null check (char_length(texto) <= 20000),
  fecha date not null default current_date,
  aprobado boolean not null default false,
  check ((anonimo and autora is null) or (not anonimo and autora is not null))
);

-- ============================================================
-- Textos enviados desde "Compartir" (llegan a Anita, no se publican solos)
-- ============================================================
create table if not exists envios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Noticia o artículo', 'Ensayo', 'Manifiesto')),
  nombre text,
  correo text not null,
  titulo text,
  texto text not null check (char_length(texto) <= 20000),
  creado timestamptz not null default now()
);

-- ============================================================
-- Solicitudes de eliminación de datos (formulario de Mi cuenta)
-- ============================================================
create table if not exists solicitudes_eliminacion (
  id uuid primary key default gen_random_uuid(),
  correo text not null,
  motivo text,
  creada timestamptz not null default now()
);

-- ============================================================
-- Seguridad (RLS): activar en todas las tablas
-- ============================================================
alter table suscriptoras enable row level security;
alter table cartas enable row level security;
alter table manifiestos enable row level security;
alter table envios enable row level security;
alter table solicitudes_eliminacion enable row level security;

-- Suscriptoras: cada una ve y crea solo su fila, sin estado activo.
-- Nadie editable por la usuaria: el estado lo cambia solo la administradora.
create policy "ver mi fila" on suscriptoras for select to authenticated
  using (user_id = auth.uid() or es_admin());
create policy "crear mi fila sin plan" on suscriptoras for insert to authenticated
  with check (user_id = auth.uid() and estado = 'sin_suscripcion');
create policy "admin edita suscriptoras" on suscriptoras for update to authenticated
  using (es_admin()) with check (es_admin());
create policy "admin borra suscriptoras" on suscriptoras for delete to authenticated
  using (es_admin());

-- Cartas: solo suscriptoras activas y la administradora.
-- Decisión pendiente: si las cartas viejas tienen lectura pública, se agrega una regla para anon.
create policy "leer carta: suscriptoras activas" on cartas for select to authenticated
  using (
    es_admin()
    or exists (
      select 1 from suscriptoras s
      where s.user_id = auth.uid() and s.estado = 'activa'
    )
  );
create policy "admin escribe cartas" on cartas for all to authenticated
  using (es_admin()) with check (es_admin());

-- Manifiestos: lectura pública solo de los aprobados; la administradora gestiona todo.
create policy "leer manifiestos aprobados" on manifiestos for select to anon, authenticated
  using (aprobado or es_admin());
create policy "admin gestiona manifiestos" on manifiestos for all to authenticated
  using (es_admin()) with check (es_admin());

-- Envíos: cualquiera puede mandar; solo la administradora los lee.
create policy "enviar texto" on envios for insert to anon, authenticated
  with check (true);
create policy "admin lee envios" on envios for select to authenticated
  using (es_admin());
create policy "admin borra envios" on envios for delete to authenticated
  using (es_admin());

-- Solicitudes de eliminación: cualquiera puede pedir; solo la administradora las ve.
create policy "pedir eliminación" on solicitudes_eliminacion for insert to anon, authenticated
  with check (true);
create policy "admin lee eliminaciones" on solicitudes_eliminacion for select to authenticated
  using (es_admin());
create policy "admin borra eliminaciones" on solicitudes_eliminacion for delete to authenticated
  using (es_admin());
