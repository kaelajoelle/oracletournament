-- Supabase schema for the Oracle Tournament shared state
-- Run this in the SQL editor or the Supabase CLI.

create table if not exists public.oracle_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.player_access (
  player_key text primary key,
  display_name text not null,
  access_code_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists player_access_hash_key on public.player_access (access_code_hash);

create table if not exists public.character_drafts (
  player_key text primary key references public.player_access(player_key) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- seed the shared row once so the API has something to read
insert into public.oracle_state (id, state)
values
  ('shared', '{"sessions": [], "rosterExtras": [], "rosterMeta": {}, "availability": {}, "buildCards": {}}')
on conflict (id) do nothing;

alter table public.oracle_state enable row level security;
alter table public.player_access enable row level security;
alter table public.character_drafts enable row level security;

-- the service role key bypasses RLS automatically, but the policy keeps
-- the table usable if you ever issue a restricted service key.
create policy "service role full access" on public.oracle_state
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role player access" on public.player_access;
create policy "service role player access" on public.player_access
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role character drafts" on public.character_drafts;
create policy "service role character drafts" on public.character_drafts
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');
