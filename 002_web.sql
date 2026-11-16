-- Cartas del Mundo · versión web (login por correo, suscripción gratuita confirmada a mano)
-- Se ejecuta después de 001_base.sql. Es idempotente: se puede correr más de una vez.

-- ---------- Columnas nuevas ----------
alter table envios add column if not exists leido boolean not null default false;
alter table solicitudes_eliminacion add column if not exists leido boolean not null default false;

-- ---------- Cortesías (cuentas gratuitas de grupo) ----------
create table if not exists cortesias (
  correo text primary key,
  creada timestamptz not null default now()
);
alter table cortesias enable row level security;

drop policy if exists "admin gestiona cortesias" on cortesias;
create policy "admin gestiona cortesias" on cortesias for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- Mensajes de contacto ----------
create table if not exists mensajes_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  correo text not null,
  motivo text not null,
  mensaje text not null,
  leido boolean not null default false,
  creado timestamptz not null default now()
);
alter table mensajes_contacto enable row level security;

drop policy if exists "enviar contacto" on mensajes_contacto;
create policy "enviar contacto" on mensajes_contacto for insert to anon, authenticated
  with check (true);

drop policy if exists "admin lee contacto" on mensajes_contacto;
create policy "admin lee contacto" on mensajes_contacto for select to authenticated
  using (public.es_admin());

drop policy if exists "admin marca contacto" on mensajes_contacto;
create policy "admin marca contacto" on mensajes_contacto for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin borra contacto" on mensajes_contacto;
create policy "admin borra contacto" on mensajes_contacto for delete to authenticated
  using (public.es_admin());

-- ---------- Permisos de administración sobre tablas existentes ----------
drop policy if exists "admin marca envios" on envios;
create policy "admin marca envios" on envios for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin marca eliminaciones" on solicitudes_eliminacion;
create policy "admin marca eliminaciones" on solicitudes_eliminacion for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- Solicitar suscripción (solo usuarias con sesión) ----------
create or replace function public.solicitar_suscripcion(
  p_edad_adulta boolean, p_tutor_correo text, p_tutor_consentimiento boolean, p_acepto boolean)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  estado_actual text;
  nuevo text;
  adulto boolean := coalesce(p_edad_adulta, false);
begin
  if uid is null then raise exception 'Hay que iniciar sesión'; end if;
  if not coalesce(p_acepto, false) then
    raise exception 'Hay que aceptar los términos y la política de privacidad';
  end if;
  if not adulto and not (coalesce(p_tutor_consentimiento, false) and coalesce(p_tutor_correo, '') <> '') then
    raise exception 'Confirmá tu edad o el consentimiento de tu madre, padre o tutor';
  end if;

  insert into public.suscriptoras (user_id, correo) values (uid, mail)
    on conflict (user_id) do nothing;
  select s.estado into estado_actual from public.suscriptoras s where s.user_id = uid;
  if estado_actual in ('activa', 'pendiente') then return estado_actual; end if;

  nuevo := case when exists (select 1 from public.cortesias c where c.correo = mail)
                then 'activa' else 'pendiente' end;
  update public.suscriptoras set
    estado = nuevo,
    edad_adulta = adulto,
    tutor_correo = case when adulto then null else p_tutor_correo end,
    tutor_consentimiento = case when adulto then false else coalesce(p_tutor_consentimiento, false) end,
    acepto_terminos = true,
    alta = now()
  where user_id = uid;
  return nuevo;
end $$;

-- ---------- Darme de baja (solo la propia cuenta) ----------
create or replace function public.cancelar_mi_suscripcion()
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Hay que iniciar sesión'; end if;
  update public.suscriptoras set estado = 'cancelada' where user_id = auth.uid();
  return 'cancelada';
end $$;

-- ---------- Carta del día o de una fecha, con o sin acceso completo ----------
-- Completa si: administradora, carta de los últimos 7 días, suscriptora activa o cortesía.
-- Si no, se ve solo el primer tema completo y los demás como títulos.
create or replace function public.carta_por_fecha(p_fecha date default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  hoy_sp date := (now() at time zone 'America/Sao_Paulo')::date;
  hora_sp time := (now() at time zone 'America/Sao_Paulo')::time;
  objetivo date;
  c public.cartas%rowtype;
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  completa boolean;
  items jsonb;
begin
  if p_fecha is not null then
    select * into c from public.cartas where fecha = p_fecha;
  else
    objetivo := case when hora_sp >= time '11:00' then hoy_sp else hoy_sp - 1 end;
    select * into c from public.cartas where fecha <= objetivo order by fecha desc limit 1;
  end if;
  if not found then return null; end if;

  completa := public.es_admin()
    or (hoy_sp - c.fecha) < 7
    or exists (select 1 from public.suscriptoras s where s.user_id = auth.uid() and s.estado = 'activa')
    or exists (select 1 from public.cortesias k where k.correo = mail);

  select jsonb_agg(
    case when completa or x.ord = 1 then x.elem
    else jsonb_build_object(
      'sec', x.elem->'sec',
      't', x.elem->'t',
      'pt', jsonb_build_object('t', x.elem->'pt'->'t'),
      'en', jsonb_build_object('t', x.elem->'en'->'t'))
    end order by x.ord)
  into items
  from jsonb_array_elements(c.items) with ordinality as x(elem, ord);

  return jsonb_build_object('fecha', c.fecha, 'completa', completa, 'items', items);
end $$;

-- ---------- Archivo: fecha, títulos y secciones de cada carta ----------
drop function if exists public.archivo_cartas();
create function public.archivo_cartas()
returns table(fecha date, t_es text, t_pt text, t_en text, secs text[])
language sql stable security definer set search_path = ''
as $$
  select c.fecha,
         c.items->0->>'t',
         c.items->0->'pt'->>'t',
         c.items->0->'en'->>'t',
         array(select distinct x.elem->>'sec' from jsonb_array_elements(c.items) as x(elem))
  from public.cartas c
  where c.fecha <= (case when (now() at time zone 'America/Sao_Paulo')::time >= time '11:00'
                         then (now() at time zone 'America/Sao_Paulo')::date
                         else (now() at time zone 'America/Sao_Paulo')::date - 1 end)
  order by c.fecha desc;
$$;

-- ---------- Permisos ----------
-- Funciones que cambian datos: solo usuarias con sesión (nunca anónimas).
revoke execute on function public.solicitar_suscripcion(boolean, text, boolean, boolean) from public, anon;
revoke execute on function public.cancelar_mi_suscripcion() from public, anon;
grant execute on function public.solicitar_suscripcion(boolean, text, boolean, boolean) to authenticated;
grant execute on function public.cancelar_mi_suscripcion() to authenticated;

-- Funciones de lectura: públicas a propósito; filtran el contenido dentro de la función.
grant execute on function public.carta_por_fecha(date) to anon, authenticated;
grant execute on function public.archivo_cartas() to anon, authenticated;
