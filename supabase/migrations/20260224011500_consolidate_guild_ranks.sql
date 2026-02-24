-- ============================================================================
-- Consolidate guild_ranks table (Phase 12) - Robust Re-creation
-- ============================================================================

-- 1) Re-create table if it's missing (it was dropped in Phase 11)
CREATE TABLE IF NOT EXISTS public.guild_ranks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rank int NOT NULL UNIQUE,
    is_visible boolean NOT NULL DEFAULT true,
    name text,
    app_role text NOT NULL DEFAULT 'raider',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Update app_role check separately to be safe
ALTER TABLE public.guild_ranks DROP CONSTRAINT IF EXISTS guild_ranks_app_role_check;
ALTER TABLE public.guild_ranks ADD CONSTRAINT guild_ranks_app_role_check CHECK (public.is_valid_role_level(app_role));

-- 3) Ensure current indices/triggers
DROP TRIGGER IF EXISTS trg_guild_ranks_updated_at ON public.guild_ranks;
CREATE TRIGGER trg_guild_ranks_updated_at
    BEFORE UPDATE ON public.guild_ranks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Re-verify RLS
ALTER TABLE public.guild_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guild_ranks_read_all" ON public.guild_ranks;
CREATE POLICY "guild_ranks_read_all"
  ON public.guild_ranks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "guild_ranks_gm_write" ON public.guild_ranks;
CREATE POLICY "guild_ranks_gm_write"
  ON public.guild_ranks FOR ALL
  USING (public.is_current_gm())
  WITH CHECK (public.is_current_gm());

-- 6) Grants
GRANT SELECT ON public.guild_ranks TO anon, authenticated;
GRANT ALL ON public.guild_ranks TO service_role;

-- 7) Seed basic data if empty
INSERT INTO public.guild_ranks (rank, name, is_visible, app_role)
VALUES 
    (0, 'Guild Master', true, 'gm'),
    (1, 'Officer', true, 'officer'),
    (2, 'Officer Alt', true, 'raider'),
    (3, 'Raider', true, 'raider'),
    (4, 'Trial', true, 'raider'),
    (5, 'Social', false, 'raider'),
    (6, 'Alt', false, 'raider'),
    (7, 'Initiate', false, 'raider'),
    (8, 'Recruit', false, 'raider'),
    (9, 'Member', false, 'raider')
ON CONFLICT (rank) DO NOTHING;
