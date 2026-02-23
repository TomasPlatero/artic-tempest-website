-- Create bnet_characters table
create table if not exists public.bnet_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  realm text not null,
  realm_slug text not null,
  class_id int not null,
  race_id int not null,
  level int not null,
  faction text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, realm_slug, name)
);

-- Enable RLS
alter table public.bnet_characters enable row level security;

-- Policies
create policy "Users can view their own bnet characters"
  on public.bnet_characters for select
  using ( auth.uid() = user_id );

-- The service role (API) must be able to insert/update/delete these records
create policy "Service role can manage bnet characters"
  on public.bnet_characters for all
  using ( true )
  with check ( true );

-- Add updated_at trigger
create trigger trg_bnet_characters_updated_at
  before update on public.bnet_characters
  for each row execute procedure public.set_updated_at();
