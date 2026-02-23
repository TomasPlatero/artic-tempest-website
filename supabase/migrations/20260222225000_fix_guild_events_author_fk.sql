-- 20260222225000_fix_guild_events_author_fk.sql
-- Change guild_events.author_id to reference public.profiles instead of auth.users

-- Drop the existing constraint
ALTER TABLE public.guild_events
  DROP CONSTRAINT IF EXISTS guild_events_author_id_fkey;

-- Add the new constraint pointing to public.profiles
ALTER TABLE public.guild_events
  ADD CONSTRAINT guild_events_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;
