-- ============================================================================
-- Add App Permissions table and update Role Levels (Phase 11)
-- ============================================================================

-- 1) Update validation function to include 'member'
CREATE OR REPLACE FUNCTION public.is_valid_role_level(level text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(coalesce($1, '')) IN ('gm','officer','raider','member')
$$;

-- 2) Create the App Permissions table
CREATE TABLE IF NOT EXISTS public.app_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_level text NOT NULL CHECK (public.is_valid_role_level(role_level)),
    app_id text NOT NULL,     -- roster, stats, calendar, bis
    can_view boolean DEFAULT true,
    can_edit boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(role_level, app_id)
);

-- 3) Trigger for updated_at
DROP TRIGGER IF EXISTS trg_app_permissions_updated_at ON public.app_permissions;
CREATE TRIGGER trg_app_permissions_updated_at
    BEFORE UPDATE ON public.app_permissions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Enable RLS
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies
DROP POLICY IF EXISTS "app_permissions_read_all" ON public.app_permissions;
CREATE POLICY "app_permissions_read_all"
  ON public.app_permissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "app_permissions_gm_write" ON public.app_permissions;
CREATE POLICY "app_permissions_gm_write"
  ON public.app_permissions FOR ALL
  USING (public.is_current_gm())
  WITH CHECK (public.is_current_gm());

-- 6) Initial Data
INSERT INTO public.app_permissions (role_level, app_id, can_view, can_edit) VALUES
('raider', 'calendar', true, false),
('raider', 'roster', true, false),
('raider', 'stats', true, false),
('raider', 'bis', true, true),
('member', 'calendar', false, false),
('member', 'roster', false, false),
('member', 'stats', false, false),
('member', 'bis', false, false)
ON CONFLICT (role_level, app_id) DO NOTHING;

-- 7) Cleanup legacy table that caused PGRST204 errors
DROP TABLE IF EXISTS public.guild_rank_visibility;
