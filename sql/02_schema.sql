-- ============================================================================
-- 02_schema.sql
-- Tablas principales y triggers (idempotente)
-- Requiere: 00_extensions.sql y 01_functions.sql ejecutados previamente
-- ============================================================================

begin;

-- ============================================================================
-- Tablas principales
-- ============================================================================

-- Roles de Discord (catálogo estático)
create table if not exists public.discord_roles (
  role_id    text primary key,
  name       text not null,
  level      text not null check (public.is_valid_role_level(level)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfiles de usuario (vinculados a auth.users)
create table if not exists public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,

  -- Discord
  discord_user_id    text unique,
  discord_username   text,
  discord_avatar     text,
  discord_role_id    text references public.discord_roles(role_id) on delete set null,
  role_level         text not null default 'raider' check (public.is_valid_role_level(role_level)),
  roles_cached       jsonb,
  last_role_check    timestamptz,

  -- Battle.net (vinculación posterior)
  battlenet_id       text unique,
  battlenet_battletag text,
  character_name     text,
  character_realm    text,
  character_region   text default 'eu',

  -- Timestamps
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Datos de la hermandad
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
-- Triggers (idempotentes con DROP + CREATE)
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

commit;
