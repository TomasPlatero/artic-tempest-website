-- 20260222165000_advanced_planning.sql
-- Nuevos campos para el planificador avanzado estilo WoWAudit

-- 1) Marcar miembros como visibles en el planificador
ALTER TABLE public.guild_members 
ADD COLUMN IF NOT EXISTS is_plannable BOOLEAN DEFAULT false;

-- 2) Ampliar event_signups con roles específicos y ordenación
ALTER TABLE public.event_signups
ADD COLUMN IF NOT EXISTS event_role TEXT, -- 'tank', 'heal', 'melee', 'ranged'
ADD COLUMN IF NOT EXISTS signup_order INT DEFAULT 0;

-- 3) Índice para agilizar la carga del planificador
CREATE INDEX IF NOT EXISTS idx_guild_members_plannable ON public.guild_members(is_plannable) WHERE is_plannable = true;
