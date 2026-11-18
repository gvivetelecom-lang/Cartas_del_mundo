-- Cartas del Mundo · registro anónimo de visitas y noticias vistas (para estadísticas).
-- No guarda IP, nombre ni correo. Se ejecuta después de 005. Es idempotente.

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  tipo text not null check (tipo in ('visita', 'lectura')),
  seccion text check (char_length(seccion) <= 80),
  titular text check (char_length(titular) <= 300)
);

create index if not exists eventos_creado_idx on public.eventos (creado);

alter table public.eventos enable row level security;

-- Cualquier visitante puede registrar un evento; nadie puede leerlos ni cambiarlos desde el sitio.
drop policy if exists "registrar eventos" on public.eventos;
create policy "registrar eventos" on public.eventos
  for insert to anon, authenticated
  with check (true);

-- Solo la administradora puede leerlos.
drop policy if exists "admin lee eventos" on public.eventos;
create policy "admin lee eventos" on public.eventos
  for select to authenticated
  using (public.es_admin());

grant insert on public.eventos to anon, authenticated;
grant usage on sequence public.eventos_id_seq to anon, authenticated;
