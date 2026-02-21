-- 01_functions.sql
-- Funciones helper y trigger genérico (idempotentes)
-- Notas: current_role_level / is_current_* marcadas SECURITY DEFINER y con search_path controlado.

create or replace function public.role_level_rank(level text)
returns int
language sql
immutable
as $$
  select case lower($1)
    when 'gm' then 3
    when 'officer' then 2
    when 'raider' then 1
    else 0
  end
$$;

create or replace function public.is_valid_role_level(level text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce($1, '')) in ('gm','officer','raider')
$$;

create or replace function public.current_role_level()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role_level
  from public.profiles p
  where p.user_id = auth.uid()
$$;

create or replace function public.is_current_gm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_level_rank(coalesce(public.current_role_level(), '')) >= 3
$$;

create or replace function public.is_current_officer_or_higher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_level_rank(coalesce(public.current_role_level(), '')) >= 2
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
