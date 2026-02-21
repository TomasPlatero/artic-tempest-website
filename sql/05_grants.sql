-- ============================================================================
-- 05_grants.sql
-- Grants y privilegios básicos en Supabase
-- Requiere: 02_schema.sql y 04_views.sql ejecutados previamente
-- ============================================================================

-- Acceso al schema
grant usage on schema public to anon, authenticated, service_role;

-- PROFILES: los usuarios autenticados pueden leer, crear y actualizar su perfil
grant select, insert, update on public.profiles to authenticated;

-- DISCORD_ROLES: lectura para autenticados
grant select on public.discord_roles to authenticated;

-- GUILDS_MANAGED: lectura para autenticados
grant select on public.guilds_managed to authenticated;

-- Vista con ranking
grant select on public.v_profiles_with_rank to authenticated;
