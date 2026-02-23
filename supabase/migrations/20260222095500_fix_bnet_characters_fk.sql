-- Change reference from auth.users to public.profiles
ALTER TABLE public.bnet_characters DROP CONSTRAINT IF EXISTS bnet_characters_user_id_fkey;
ALTER TABLE public.bnet_characters ADD CONSTRAINT bnet_characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
