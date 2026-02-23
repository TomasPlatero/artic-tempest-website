-- ============================================================================
-- guild_rank_visibility: Almacena la configuración de qué rangos de Bnet
-- se sincronian activamente al roster o se ocultan.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.guild_rank_visibility (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_id     int NOT NULL UNIQUE,
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_guild_rank_visibility_updated_at ON public.guild_rank_visibility;
CREATE TRIGGER trg_guild_rank_visibility_updated_at
  BEFORE UPDATE ON public.guild_rank_visibility
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert default rows for the 10 basic WoW ranks (0-9)
INSERT INTO public.guild_rank_visibility (rank_id, is_visible)
VALUES 
    (0, true),
    (1, true),
    (2, true),
    (3, true),
    (4, true),
    (5, false),  -- Social default hidden
    (6, false),  -- Alt default hidden
    (7, false),  -- Initiate default hidden
    (8, false),  -- Recruit default hidden
    (9, false)   -- Member default hidden
ON CONFLICT (rank_id) DO NOTHING;

-- RLS
ALTER TABLE public.guild_rank_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guild_rank_visibility_read_all" ON public.guild_rank_visibility;
CREATE POLICY "guild_rank_visibility_read_all"
  ON public.guild_rank_visibility FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "guild_rank_visibility_gm_write" ON public.guild_rank_visibility;
CREATE POLICY "guild_rank_visibility_gm_write"
  ON public.guild_rank_visibility FOR ALL
  USING (public.is_current_gm())
  WITH CHECK (public.is_current_gm());

-- Grants
GRANT SELECT ON public.guild_rank_visibility TO authenticated;
