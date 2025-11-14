-- Migration script to fix RLS policies for service role access (JSON storage mode)
-- This script updates the RLS policies to use the correct JWT role check
-- instead of auth.role() which doesn't work properly with REST API requests
--
-- Run this script in your Supabase SQL editor to fix the permission denied errors
-- when using the service role key via the REST API in JSON storage mode.
--
-- Date: 2025-11-14
-- Issue: "permission denied for table oracle_state" when accessing /api/state

begin;

-- Update oracle_state table policy
drop policy if exists "service role full access" on public.oracle_state;
create policy "service role full access" on public.oracle_state
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update player_access table policy
drop policy if exists "service role player access" on public.player_access;
create policy "service role player access" on public.player_access
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Update character_drafts table policy
drop policy if exists "service role character drafts" on public.character_drafts;
create policy "service role character drafts" on public.character_drafts
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
