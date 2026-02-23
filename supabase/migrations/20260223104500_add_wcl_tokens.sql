-- Add WCL API tokens to guilds_managed
alter table public.guilds_managed add column if not exists wcl_client_id text;
alter table public.guilds_managed add column if not exists wcl_client_secret text;
