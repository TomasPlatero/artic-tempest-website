-- ============================================================================
-- Seed inicial: roles Discord + hermandad Artic Tempest
-- ============================================================================

-- Catálogo de roles Discord
INSERT INTO public.discord_roles (role_id, name, level)
VALUES
  ('1251201560042541108', 'Guild Master', 'gm'),
  ('1264627816234745888', 'Officer',      'officer'),
  ('1412031080407629856', 'Raider',       'raider')
ON CONFLICT (role_id) DO UPDATE
SET name       = excluded.name,
    level      = excluded.level,
    updated_at = now();

-- Datos de la hermandad
INSERT INTO public.guilds_managed (guild_id, name, region, realm, faction)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Artic Tempest', 'eu', 'Dun Modr', 'horde')
ON CONFLICT (guild_id) DO UPDATE
SET name       = excluded.name,
    region     = excluded.region,
    realm      = excluded.realm,
    faction    = excluded.faction,
    updated_at = now();
