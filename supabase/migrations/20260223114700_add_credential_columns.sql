-- Migration: Add integration credential columns to guilds_managed
-- Run this in Supabase SQL Editor

ALTER TABLE guilds_managed
  ADD COLUMN IF NOT EXISTS discord_client_id TEXT,
  ADD COLUMN IF NOT EXISTS discord_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS discord_guild_id TEXT,
  ADD COLUMN IF NOT EXISTS bnet_client_id TEXT,
  ADD COLUMN IF NOT EXISTS bnet_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS wcl_client_id TEXT,
  ADD COLUMN IF NOT EXISTS wcl_client_secret TEXT;

-- Pre-populate with values from .env.local
UPDATE guilds_managed
SET
  discord_client_id = '1297669819130183680',
  discord_client_secret = '911cq7DYbHFujspPCff8f6evDtMJnMJn',
  discord_guild_id = '1251201368467701791',
  bnet_client_id = '645c9a321dad457ba6b4b74a3ac11b1f',
  bnet_client_secret = '1vjrynqS5kj5MCkbMMav9WuvcIa3rkcL'
WHERE wcl_client_id IS NULL;
