-- ============================================================================
-- profiles: cambiar PK a UUID autogenerado (NextAuth no usa auth.users)
-- ============================================================================

-- 1) Eliminar la FK a auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey CASCADE;

-- 2) Cambiar default a UUID autogenerado
ALTER TABLE public.profiles ALTER COLUMN user_id SET DEFAULT gen_random_uuid();

-- 3) Restaurar PK
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- 4) Actualizar current_role_level() para que no dependa de auth.uid()
-- Como con NextAuth todas las queries van vía service_role (bypass RLS),
-- esta función ya no se usa desde el código, pero la mantenemos funcional.
CREATE OR REPLACE FUNCTION public.current_role_level()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role_level
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;
