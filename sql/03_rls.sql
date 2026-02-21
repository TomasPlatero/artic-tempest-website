-- ============================================================================
-- 03_rls.sql
-- Activación de RLS y definición de policies (idempotente)
-- Requiere: 02_schema.sql ejecutado previamente
-- ============================================================================

begin;

-- ============================================================================
-- Activar RLS
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.discord_roles   enable row level security;
alter table public.guilds_managed  enable row level security;

-- ============================================================================
-- PROFILES
-- ============================================================================

-- INSERT: un usuario autenticado puede crear su propio perfil
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
  on public.profiles
  for insert
  with check (user_id = auth.uid());

-- SELECT: el usuario ve su propio perfil, officers+ ven todos
drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select"
  on public.profiles
  for select
  using (user_id = auth.uid() or public.is_current_officer_or_higher());

-- UPDATE: el usuario puede actualizar su propio perfil
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles
  for update
  using (user_id = auth.uid());

-- UPDATE: el GM puede actualizar cualquier perfil
drop policy if exists "profiles_gm_update_all" on public.profiles;
create policy "profiles_gm_update_all"
  on public.profiles
  for update
  using (public.is_current_gm());

-- ============================================================================
-- DISCORD_ROLES
-- ============================================================================

-- SELECT: cualquier autenticado puede leer roles
drop policy if exists "discord_roles_read_all" on public.discord_roles;
create policy "discord_roles_read_all"
  on public.discord_roles
  for select
  using (true);

-- ALL: solo el GM puede modificar roles
drop policy if exists "discord_roles_gm_write" on public.discord_roles;
create policy "discord_roles_gm_write"
  on public.discord_roles
  for all
  using (public.is_current_gm())
  with check (public.is_current_gm());

-- ============================================================================
-- GUILDS_MANAGED
-- ============================================================================

-- SELECT: officers y GM pueden leer datos de la hermandad
drop policy if exists "guilds_officers_read" on public.guilds_managed;
create policy "guilds_officers_read"
  on public.guilds_managed
  for select
  using (public.is_current_officer_or_higher());

-- ALL: solo el GM puede modificar datos de la hermandad
drop policy if exists "guilds_gm_write" on public.guilds_managed;
create policy "guilds_gm_write"
  on public.guilds_managed
  for all
  using (public.is_current_gm())
  with check (public.is_current_gm());

commit;