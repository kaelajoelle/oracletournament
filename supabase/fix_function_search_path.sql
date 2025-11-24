-- Patch existing Supabase instances to appease the Security Advisor warning
-- about functions without an explicit search_path. This redefines the
-- set_player_access_updated_at trigger function with a fixed search_path.

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
