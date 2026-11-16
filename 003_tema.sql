-- Cartas del Mundo · tema del manifiesto de cada día
-- Se ejecuta después de 002_web.sql. Es idempotente: se puede correr más de una vez.

-- ---------- Columna nueva ----------
-- tema: { "t": título, "p": párrafo opcional, "preguntas": [...], "seguir": [...] }
alter table public.cartas add column if not exists tema jsonb;

-- ---------- Carta de un día, ahora con su tema ----------
-- Igual que en 002, más la clave "tema" (null si la carta no trae tema).
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

  return jsonb_build_object('fecha', c.fecha, 'completa', completa, 'items', items, 'tema', c.tema);
end $$;
