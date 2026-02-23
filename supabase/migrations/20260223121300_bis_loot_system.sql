-- Migration: BiS Loot System tables
-- Run in Supabase SQL Editor

-- Cache of raid loot fetched from Blizzard Journal API
CREATE TABLE IF NOT EXISTS raid_loot_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id int NOT NULL,
    instance_name text NOT NULL,
    difficulty text NOT NULL DEFAULT 'heroic',
    loot_data jsonb NOT NULL DEFAULT '[]'::jsonb,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(instance_id, difficulty)
);

-- Player BiS selections (replaces old bis_wishlist)
CREATE TABLE IF NOT EXISTS bis_selections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES guild_members(id) ON DELETE CASCADE,
    item_id int NOT NULL,
    item_name text NOT NULL,
    item_icon text,
    slot text NOT NULL,
    boss_name text,
    priority int NOT NULL DEFAULT 2,
    difficulty text NOT NULL DEFAULT 'heroic',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(member_id, item_id, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_bis_selections_member ON bis_selections(member_id);
