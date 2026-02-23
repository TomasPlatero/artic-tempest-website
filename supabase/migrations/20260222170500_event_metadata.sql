-- 20260222170500_event_metadata.sql
-- Añadir columna para persistir qué bosses se han marcado para el evento

ALTER TABLE public.guild_events
ADD COLUMN IF NOT EXISTS selected_bosses JSONB DEFAULT '[]'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN public.guild_events.selected_bosses IS 'Lista de IDs o nombres de jefes seleccionados para este evento';
