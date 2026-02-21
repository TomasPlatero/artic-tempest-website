-- ============================================================================
-- guild_members: roster importado desde Battle.net API
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.guild_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name   text NOT NULL,
  realm_slug       text NOT NULL,
  realm_name       text,
  class_id         int,
  race_id          int,
  level            int NOT NULL DEFAULT 1,
  rank             int NOT NULL DEFAULT 0,
  profile_id       uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  synced_at        timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_name, realm_slug)
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_guild_members_updated_at ON public.guild_members;
CREATE TRIGGER trg_guild_members_updated_at
  BEFORE UPDATE ON public.guild_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guild_members_read_all" ON public.guild_members;
CREATE POLICY "guild_members_read_all"
  ON public.guild_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "guild_members_gm_write" ON public.guild_members;
CREATE POLICY "guild_members_gm_write"
  ON public.guild_members FOR ALL
  USING (public.is_current_gm())
  WITH CHECK (public.is_current_gm());

-- Grants
GRANT SELECT ON public.guild_members TO authenticated;
