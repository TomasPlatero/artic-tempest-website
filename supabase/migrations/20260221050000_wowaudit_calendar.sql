-- 05_wowaudit_calendar.sql
-- Ampliación de campos para replicar sistema de Wowaudit

-- Añadir nuevas columnas a guild_events
ALTER TABLE public.guild_events
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned',
ADD COLUMN IF NOT EXISTS background_url TEXT,
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;

-- Inicializar end_date para eventos existentes (2 horas después de event_date por defecto)
UPDATE public.guild_events 
SET end_date = event_date + interval '2 hours' 
WHERE end_date IS NULL;

-- Restaurar el NOT NULL ahora que tienen datos
ALTER TABLE public.guild_events ALTER COLUMN end_date SET NOT NULL;


-- Añadir columnas a event_signups
ALTER TABLE public.event_signups
ADD COLUMN IF NOT EXISTS selection_status TEXT DEFAULT 'queued', -- 'queued' o 'selected'
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Ajustar restricción de status si fuese necesario o añadir CHECK
-- Valores comunes de Wowaudit: present, late, tentative, absent
