-- ============================================================================
-- Add app_role to guild_ranks for Dynamic Permission Automation (Phase 10)
-- ============================================================================

ALTER TABLE public.guild_ranks
ADD COLUMN IF NOT EXISTS app_role text NOT NULL DEFAULT 'raider' CHECK (public.is_valid_role_level(app_role));

-- By default, rank 0 (Guild Master) should probably be 'gm'
UPDATE public.guild_ranks SET app_role = 'gm' WHERE rank = 0;
-- And Officers (rank 1) might be 'officer'
UPDATE public.guild_ranks SET app_role = 'officer' WHERE rank = 1;
