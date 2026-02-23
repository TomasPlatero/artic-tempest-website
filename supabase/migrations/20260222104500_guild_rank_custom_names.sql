-- ============================================================================
-- guild_rank_visibility_names
-- Añade la columna `name` para que los Guild Masters puedan editar los
-- nombres de los 10 rangos originales de World of Warcraft a su gusto.
-- ============================================================================

ALTER TABLE public.guild_rank_visibility ADD COLUMN IF NOT EXISTS name text;

-- Valores por defecto a saco
UPDATE public.guild_rank_visibility SET name = 'Guild Master' WHERE rank_id = 0 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Officer' WHERE rank_id = 1 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Officer Alt' WHERE rank_id = 2 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Raider' WHERE rank_id = 3 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Trial' WHERE rank_id = 4 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Social' WHERE rank_id = 5 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Alt' WHERE rank_id = 6 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Initiate' WHERE rank_id = 7 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Recruit' WHERE rank_id = 8 AND name IS NULL;
UPDATE public.guild_rank_visibility SET name = 'Member' WHERE rank_id = 9 AND name IS NULL;
