-- Cartas del Mundo · aceptación automática de suscripciones (corre dentro de Supabase)
-- Se ejecuta después de 003_tema.sql. Es idempotente: se puede correr más de una vez.

-- Programador de tareas dentro de la base (pg_cron).
create extension if not exists pg_cron with schema pg_catalog;

-- Marcas de cada suscripción: cuándo fue aceptada y cuándo se le envió el correo (pendiente).
alter table public.suscriptoras add column if not exists aceptada_at timestamptz;
alter table public.suscriptoras add column if not exists correo_enviado_at timestamptz;

-- Acepta los pendientes que cumplen las reglas. Excluye la cuenta de administradora.
-- Adultos que aceptaron los términos, o menores con consentimiento de su tutor.
create or replace function public.aceptar_suscripciones_automatico()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  with ok as (
    update public.suscriptoras s
       set estado = 'activa', aceptada_at = now()
     where s.estado = 'pendiente'
       and s.acepto_terminos
       and s.correo <> 'ancorvalan.a@gmail.com'
       and (s.edad_adulta or (s.tutor_consentimiento and coalesce(s.tutor_correo, '') <> ''))
    returning 1
  )
  select count(*) into n from ok;
  return n;
end $$;

-- Solo lo ejecuta el programador de la base, nunca una visita anónima ni una usuaria.
revoke execute on function public.aceptar_suscripciones_automatico() from public, anon, authenticated;

-- Programa la corrida cada minuto (reemplaza la anterior si ya existía).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'aceptar-suscripciones') then
    perform cron.unschedule('aceptar-suscripciones');
  end if;
end $$;

select cron.schedule('aceptar-suscripciones', '* * * * *', 'select public.aceptar_suscripciones_automatico();');
