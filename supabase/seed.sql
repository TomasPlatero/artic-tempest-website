-- ============================================================================
-- Seed data para GuildBoard
-- Se ejecuta con: npx supabase db reset (aplica migraciones + seed)
-- ============================================================================

-- Catálogo de roles Discord
insert into public.discord_roles (role_id, name, level)
values
  ('1251201560042541108', 'Guild Master', 'gm'),
  ('1264627816234745888', 'Officer',      'officer'),
  ('1412031080407629856', 'Raider',       'raider')
on conflict (role_id) do update
set name       = excluded.name,
    level      = excluded.level,
    updated_at = now();

-- Datos de la hermandad
insert into public.guilds_managed (guild_id, name, region, realm, faction)
values
  ('a0000000-0000-4000-8000-000000000001', 'Artic Tempest', 'eu', 'Dun Modr', 'horde')
on conflict (guild_id) do update
set name       = excluded.name,
    region     = excluded.region,
    realm      = excluded.realm,
    faction    = excluded.faction,
    updated_at = now();
