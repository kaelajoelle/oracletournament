-- Migration script to fix RLS policies for service role access
-- This script updates the RLS policies to use the correct JWT role check
-- instead of auth.role() which doesn't work properly with REST API requests
--
-- Run this script in your Supabase SQL editor to fix the permission denied errors
-- when using the service role key via the REST API.
--
-- Date: 2025-11-14
-- Issue: "permission denied for table roster_extras" when accessing /api/state

begin;

-- Update sessions table policy
drop policy if exists "service role sessions" on public.sessions;
create policy "service role sessions" on public.sessions
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update session_players table policy
drop policy if exists "service role session players" on public.session_players;
create policy "service role session players" on public.session_players
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update roster_extras table policy
drop policy if exists "service role roster extras" on public.roster_extras;
create policy "service role roster extras" on public.roster_extras
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update roster_meta table policy
drop policy if exists "service role roster meta" on public.roster_meta;
create policy "service role roster meta" on public.roster_meta
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update availability table policy
drop policy if exists "service role availability" on public.availability;
create policy "service role availability" on public.availability
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update build_cards table policy
drop policy if exists "service role build cards" on public.build_cards;
create policy "service role build cards" on public.build_cards
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update comments table policy
drop policy if exists "service role comments" on public.comments;
create policy "service role comments" on public.comments
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update character_drafts table policy
drop policy if exists "service role character drafts" on public.character_drafts;
create policy "service role character drafts" on public.character_drafts
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update player_access table policy
drop policy if exists "service role player access" on public.player_access;
create policy "service role player access" on public.player_access
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

commit;

-- Verification query - should show all policies updated successfully
select 
  schemaname,
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
  and policyname like 'service role%'
order by tablename;
