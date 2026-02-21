-- 04_views.sql
-- Vistas útiles

create or replace view public.v_profiles_with_rank as
select
  p.*,
  public.role_level_rank(p.role_level) as role_rank
from public.profiles p;
