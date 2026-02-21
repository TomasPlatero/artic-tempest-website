-- ============================================================================
-- Initial Schema – GuildBoard
-- Extensiones, funciones, tablas, triggers, RLS, vistas y grants
-- ============================================================================

-- ============================================================================
-- 1) Extensiones
-- ============================================================================

create extension if not exists "uuid-ossp" with schema public;
create extension if not exists "pgcrypto"  with schema public;

-- ============================================================================
-- 2) Funciones helper (sin dependencia de tablas)
-- ============================================================================

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

-- ============================================================================
-- 3) Tablas
-- ============================================================================

create table if not exists public.discord_roles (
  role_id    text primary key,
  name       text not null,
  level      text not null check (public.is_valid_role_level(level)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  discord_user_id    text unique,
  discord_username   text,
  discord_avatar     text,
  discord_role_id    text references public.discord_roles(role_id) on delete set null,
  role_level         text not null default 'raider' check (public.is_valid_role_level(role_level)),
  roles_cached       jsonb,
  last_role_check    timestamptz,
  battlenet_id       text unique,
  battlenet_battletag text,
  character_name     text,
  character_realm    text,
  character_region   text default 'eu',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.guilds_managed (
  guild_id         uuid primary key default gen_random_uuid(),
  name             text not null,
  region           text not null default 'eu',
  realm            text not null,
  faction          text not null default 'horde',
  discord_guild_id text unique,
  member_count     int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================================
-- 4) Funciones helper (dependen de profiles)
-- ============================================================================

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

-- ============================================================================
-- 5) Triggers
-- ============================================================================

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_discord_roles_updated_at on public.discord_roles;
create trigger trg_discord_roles_updated_at
  before update on public.discord_roles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_guilds_managed_updated_at on public.guilds_managed;
create trigger trg_guilds_managed_updated_at
  before update on public.guilds_managed
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6) RLS
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.discord_roles   enable row level security;
alter table public.guilds_managed  enable row level security;

-- PROFILES

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
  on public.profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select"
  on public.profiles for select
  using (user_id = auth.uid() or public.is_current_officer_or_higher());

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles for update
  using (user_id = auth.uid());

drop policy if exists "profiles_gm_update_all" on public.profiles;
create policy "profiles_gm_update_all"
  on public.profiles for update
  using (public.is_current_gm());

-- DISCORD_ROLES

drop policy if exists "discord_roles_read_all" on public.discord_roles;
create policy "discord_roles_read_all"
  on public.discord_roles for select
  using (true);

drop policy if exists "discord_roles_gm_write" on public.discord_roles;
create policy "discord_roles_gm_write"
  on public.discord_roles for all
  using (public.is_current_gm())
  with check (public.is_current_gm());

-- GUILDS_MANAGED

drop policy if exists "guilds_officers_read" on public.guilds_managed;
create policy "guilds_officers_read"
  on public.guilds_managed for select
  using (public.is_current_officer_or_higher());

drop policy if exists "guilds_gm_write" on public.guilds_managed;
create policy "guilds_gm_write"
  on public.guilds_managed for all
  using (public.is_current_gm())
  with check (public.is_current_gm());

-- ============================================================================
-- 7) Vista
-- ============================================================================

create or replace view public.v_profiles_with_rank as
select p.*, public.role_level_rank(p.role_level) as role_rank
from public.profiles p;

-- ============================================================================
-- 8) Grants
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on public.profiles             to authenticated;
grant select on public.discord_roles                        to authenticated;
grant select on public.guilds_managed                       to authenticated;
grant select on public.v_profiles_with_rank                 to authenticated;
