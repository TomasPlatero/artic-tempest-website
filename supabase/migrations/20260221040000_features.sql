-- 04_features.sql
-- Tablas para Calendario, BiS y mapeo de Roles de Discord

-- ==========================================
-- CALENDARIO (Eventos y asistiencias)
-- ==========================================
CREATE TABLE public.guild_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES public.guilds_managed(guild_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'raid', -- raid, mythic_plus, meeting, other
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signups para eventos (vinculado al guild_member, no solo al profile)
CREATE TABLE public.event_signups (
    event_id UUID NOT NULL REFERENCES public.guild_events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.guild_members(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL, -- Quien se apuntó (opcional)
    status TEXT NOT NULL DEFAULT 'tentative', -- accepted, tentative, declined, standby
    role_preference TEXT, -- tank, healer, dps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, member_id)
);

-- ==========================================
-- Best in Slot (BiS)
-- ==========================================
CREATE TABLE public.bis_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.guild_members(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL, -- Wowhead item ID
    item_name TEXT NOT NULL,
    slot TEXT NOT NULL, -- head, neck, shoulder, etc.
    priority INTEGER DEFAULT 1, -- 1=High (BiS), 2=Medium (Upgrade)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(member_id, item_id)
);

-- ==========================================
-- DISCORD ROLE MAPPINGS
-- ==========================================
-- Para asignar niveles de acceso en la web según el rol en Discord
CREATE TABLE public.discord_role_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_role_id TEXT NOT NULL UNIQUE,
    role_name TEXT NOT NULL, -- e.g. "GM", "Officer", "Raider" (informativo)
    app_role TEXT NOT NULL CHECK (app_role IN ('gm', 'officer', 'raider', 'member')), -- El nivel de acceso real en la app
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SEGURIDAD (Row Level Security)
-- ==========================================
ALTER TABLE public.guild_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bis_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_role_mappings ENABLE ROW LEVEL SECURITY;

-- Asignación de permisos al Service Role
GRANT ALL ON public.guild_events TO service_role;
GRANT ALL ON public.event_signups TO service_role;
GRANT ALL ON public.bis_wishlist TO service_role;
GRANT ALL ON public.discord_role_mappings TO service_role;
