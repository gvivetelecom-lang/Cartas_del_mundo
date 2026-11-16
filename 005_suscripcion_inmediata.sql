-- Cartas del Mundo · suscripción inmediata con datos de contacto
-- Se ejecuta después de 004. Es idempotente: se puede correr más de una vez.

-- Quitar la aceptación automática pendiente (ya no hay pedidos pendientes).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'aceptar-suscripciones') then
    perform cron.unschedule('aceptar-suscripciones');
  end if;
end $$;
drop function if exists public.aceptar_suscripciones_automatico();

-- Datos de contacto y fecha de baja.
alter table public.suscriptoras add column if not exists nombre text;
alter table public.suscriptoras add column if not exists apellido text;
alter table public.suscriptoras add column if not exists celular text;
alter table public.suscriptoras add column if not exists baja_at timestamptz;

-- Suscribirse: queda activa al instante. Pide nombre, apellido y celular con +.
drop function if exists public.solicitar_suscripcion(boolean, text, boolean, boolean);
create or replace function public.solicitar_suscripcion(p_nombre text, p_apellido text, p_celular text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  cel text := regexp_replace(coalesce(p_celular, ''), '[^0-9+]', '', 'g');
  nom text := btrim(coalesce(p_nombre, ''));
  ape text := btrim(coalesce(p_apellido, ''));
begin
  if uid is null then raise exception 'Hay que iniciar sesión'; end if;
  if nom = '' or ape = '' then raise exception 'Completá nombre y apellido'; end if;
  if cel !~ '^[+][0-9]{8,15}$' then
    raise exception 'El celular tiene que empezar con + y el código de país, por ejemplo +595981123456';
  end if;

  insert into public.suscriptoras (user_id, correo, estado, nombre, apellido, celular, acepto_terminos, alta)
  values (uid, mail, 'activa', nom, ape, cel, true, now())
  on conflict (user_id) do nothing;

  -- Si ya existía y estaba dada de baja, vuelve a quedar activa (la fecha de alta original se conserva).
  update public.suscriptoras
     set estado = 'activa', nombre = nom, apellido = ape, celular = cel,
         baja_at = null, acepto_terminos = true
   where user_id = uid and estado <> 'activa';

  return 'activa';
end $$;

-- Darse de baja: queda marcada la fecha y hora.
create or replace function public.cancelar_mi_suscripcion()
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Hay que iniciar sesión'; end if;
  update public.suscriptoras
     set estado = 'cancelada', baja_at = now()
   where user_id = auth.uid() and estado <> 'cancelada';
  return 'cancelada';
end $$;

revoke execute on function public.solicitar_suscripcion(text, text, text) from public, anon;
grant execute on function public.solicitar_suscripcion(text, text, text) to authenticated;
revoke execute on function public.cancelar_mi_suscripcion() from public, anon;
grant execute on function public.cancelar_mi_suscripcion() to authenticated;
