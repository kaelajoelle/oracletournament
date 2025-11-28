-- Supabase schema for the Oracle Tournament normalized tables storage mode
-- Run via `npm run supabase:bootstrap` with SUPABASE_STORAGE_MODE=tables or execute manually.

create extension if not exists "pgcrypto";

begin;

-- Create player_access table first since other tables will reference it
create table if not exists public.player_access (
  player_key text primary key,
  display_name text not null,
  access_code_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id text primary key,
  title text not null,
  dm text not null,
  date text not null,
  capacity integer not null,
  finale boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.session_players (
  session_id text not null references public.sessions(id) on delete cascade,
  player_key text not null references public.player_access(player_key) on delete cascade,
  player_name text not null,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, player_key)
);

create table if not exists public.roster_extras (
  player_key text primary key references public.player_access(player_key) on delete cascade,
  name text not null,
  status text,
  notes text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roster_meta (
  player_key text primary key references public.player_access(player_key) on delete cascade,
  status text,
  notes text,
  updated_at timestamptz not null default timezone('utc', now())
);

-- NOTE: The availability table is deprecated and no longer used by the application.
-- It is kept here for backward compatibility with existing databases.
-- New installations may omit this table. Existing installations can drop it manually if desired.
create table if not exists public.availability (
  player_key text not null references public.player_access(player_key) on delete cascade,
  player_name text not null,
  date text not null,
  available boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (player_key, date)
);

create table if not exists public.build_cards (
  player_key text primary key references public.player_access(player_key) on delete cascade,
  class text,
  university text,
  character_name text,
  build_data jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  player_name text,
  character_name text,
  session_id text,
  comment text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.character_drafts (
  id text primary key,
  player_key text not null references public.player_access(player_key) on delete cascade,
  character_name text,
  draft_data jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists player_access_hash_key on public.player_access (access_code_hash);

create or replace function public.set_player_access_updated_at()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_player_access_updated_at on public.player_access;
create trigger set_player_access_updated_at
  before update on public.player_access
  for each row
  execute procedure public.set_player_access_updated_at();

create or replace view public.player_access_overview as
  select player_key, display_name, last_login_at, created_at, updated_at
  from public.player_access;

insert into public.sessions (id, title, dm, date, capacity, finale)
values
  ('s1', 'Trial 1', 'Kaela &amp; Tory', '2025-12-21', 6, false),
  ('s2', 'Trial 2', 'Kaela &amp; Tory', '2025-12-22', 6, false),
  ('s3', 'Trial 3', 'Kaela &amp; Tory', '2025-12-26', 6, false),
  ('s4', 'Trial 4', 'Kaela &amp; Tory', '2025-12-27', 6, false),
  ('s5', 'Trial 5', 'Kaela &amp; Tory', '2025-12-28', 6, false),
  ('s6', 'Trial 6', 'Kaela &amp; Tory', '2025-12-29', 6, false),
  ('finale', 'Grand Finale', 'Kaela &amp; Tory', '2026-01-01', 8, true)
on conflict (id) do update set
  title = excluded.title,
  dm = excluded.dm,
  date = excluded.date,
  capacity = excluded.capacity,
  finale = excluded.finale,
  updated_at = timezone('utc', now());

alter table public.sessions enable row level security;
alter table public.session_players enable row level security;
alter table public.roster_extras enable row level security;
alter table public.roster_meta enable row level security;
alter table public.availability enable row level security;
alter table public.build_cards enable row level security;
alter table public.comments enable row level security;
alter table public.character_drafts enable row level security;
alter table public.player_access enable row level security;

drop policy if exists "service role sessions" on public.sessions;
create policy "service role sessions" on public.sessions
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role session players" on public.session_players;
create policy "service role session players" on public.session_players
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role roster extras" on public.roster_extras;
create policy "service role roster extras" on public.roster_extras
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role roster meta" on public.roster_meta;
create policy "service role roster meta" on public.roster_meta
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role availability" on public.availability;
create policy "service role availability" on public.availability
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role build cards" on public.build_cards;
create policy "service role build cards" on public.build_cards
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role comments" on public.comments;
create policy "service role comments" on public.comments
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role character drafts" on public.character_drafts;
create policy "service role character drafts" on public.character_drafts
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists "service role player access" on public.player_access;
create policy "service role player access" on public.player_access
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

commit;
