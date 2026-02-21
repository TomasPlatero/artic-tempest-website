-- ============================================================================
-- removes.sql
-- GuildBoard – Script de limpieza total (Reset SQL)
-- Elimina todo el esquema relacionado con GuildBoard
-- Compatible con Supabase / PostgreSQL
-- ============================================================================

begin;

-- ============================================================================
-- 1) Desactivar RLS para poder eliminar todo
-- ============================================================================

alter table if exists public.profiles       disable row level security;
alter table if exists public.discord_roles   disable row level security;
alter table if exists public.guilds_managed  disable row level security;

-- ============================================================================
-- 2) Eliminar vistas
-- ============================================================================

drop view if exists public.v_profiles_with_rank cascade;

-- ============================================================================
-- 3) Eliminar triggers
-- ============================================================================

drop trigger if exists trg_profiles_updated_at       on public.profiles;
drop trigger if exists trg_discord_roles_updated_at   on public.discord_roles;
drop trigger if exists trg_guilds_managed_updated_at  on public.guilds_managed;

-- ============================================================================
-- 4) Eliminar policies
-- ============================================================================

-- Profiles
drop policy if exists "profiles_self_insert"     on public.profiles;
drop policy if exists "profiles_owner_select"    on public.profiles;
drop policy if exists "profiles_owner_update"    on public.profiles;
drop policy if exists "profiles_officers_select_all" on public.profiles;
drop policy if exists "profiles_gm_update_all"   on public.profiles;

-- Discord Roles
drop policy if exists "discord_roles_read_all"   on public.discord_roles;
drop policy if exists "discord_roles_gm_write"   on public.discord_roles;

-- Guilds Managed
drop policy if exists "guilds_officers_read"     on public.guilds_managed;
drop policy if exists "guilds_gm_write"          on public.guilds_managed;

-- ============================================================================
-- 5) Eliminar tablas (en orden de dependencias)
-- ============================================================================

drop table if exists public.profiles       cascade;
drop table if exists public.discord_roles   cascade;
drop table if exists public.guilds_managed  cascade;

-- ============================================================================
-- 6) Eliminar funciones auxiliares
-- ============================================================================

drop function if exists public.role_level_rank(text)          cascade;
drop function if exists public.is_valid_role_level(text)      cascade;
drop function if exists public.current_role_level()           cascade;
drop function if exists public.is_current_gm()                cascade;
drop function if exists public.is_current_officer_or_higher() cascade;
drop function if exists public.set_updated_at()               cascade;

-- ============================================================================
-- 7) Eliminar extensiones (comentar si se usan en otros proyectos)
-- ============================================================================

-- drop extension if exists "uuid-ossp";
-- drop extension if exists "pgcrypto";

-- ============================================================================
-- 8) Limpieza de índices huérfanos
-- ============================================================================

do $$
declare
  idx record;
begin
  for idx in
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and indexname like 'idx_%'
  loop
    execute format('drop index if exists public.%I;', idx.indexname);
  end loop;
end $$;

commit;

-- ============================================================================
-- Resultado esperado:
--   - Tablas profiles, discord_roles, guilds_managed eliminadas
--   - Triggers, funciones, policies y vistas borradas
--   - Extensiones comentadas por seguridad (descomentar si es necesario)
-- ============================================================================
