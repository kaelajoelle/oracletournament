-- Supabase schema for the Oracle Tournament shared state
-- Run this in the SQL editor or the Supabase CLI.

create table if not exists public.oracle_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.character_drafts (
  player_key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- seed the shared row once so the API has something to read
insert into public.oracle_state (id, state)
values
  ('shared', '{"sessions": [], "rosterExtras": [], "rosterMeta": {}, "availability": {}, "buildCards": {}}')
on conflict (id) do nothing;

alter table public.oracle_state enable row level security;

-- the service role key bypasses RLS automatically, but the policy keeps
-- the table usable if you ever issue a restricted service key.
create policy "service role full access" on public.oracle_state
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role character drafts" on public.character_drafts;
create policy "service role character drafts" on public.character_drafts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
