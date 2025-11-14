# RLS Policy Fix for Service Role Access

## Problem

When using the Oracle Tournament API with Supabase, you may encounter errors like:

```
GET https://oracletournament.onrender.com/api/state 500 (Internal Server Error)
Error: {"error":"Supabase query failed (403): {\"code\":\"42501\",\"details\":null,\"hint\":null,\"message\":\"permission denied for table roster_extras\"}"}
```

or

```
Error: {"error":"Supabase query failed (403): {\"code\":\"42501\",\"details\":null,\"hint\":null,\"message\":\"permission denied for table oracle_state\"}"}
```

This happens because the Row Level Security (RLS) policies were using `auth.role() = 'service_role'`, which doesn't work correctly when making REST API requests with the service role key.

## Root Cause

In Supabase, when you make REST API calls using the service role key, the `auth.role()` function does not properly evaluate to `'service_role'`. Instead, you need to check the JWT claims directly using `auth.jwt() ->> 'role'`.

## Solution

Update all RLS policies to use the correct JWT role check.

### For Existing Deployments

If you already have a Supabase database set up, run the appropriate migration script based on your storage mode:

**Tables Mode** (SUPABASE_STORAGE_MODE=tables):
1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/fix_rls_policies.sql`
4. Execute the script

**JSON Mode** (SUPABASE_STORAGE_MODE=json or default):
1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/fix_rls_policies_json_mode.sql`
4. Execute the script

Both scripts will:
- Drop the existing incorrect policies
- Create new policies with the correct JWT role check
- Verify the policies were updated successfully

### For New Deployments

If you're setting up a fresh Supabase instance:
- **Tables Mode**: Use the updated `supabase/oracle_tables.sql` schema file
- **JSON Mode**: Use the updated `supabase/oracle_state.sql` schema file

Both already include the correct RLS policies.

## What Changed

**Before (incorrect):**
```sql
create policy "service role sessions" on public.sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

**After (correct):**
```sql
create policy "service role sessions" on public.sessions
  for all
  using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');
```

## Affected Tables

### Tables Mode
All tables with RLS policies have been updated:
- `sessions`
- `session_players`
- `roster_extras`
- `roster_meta`
- `availability`
- `build_cards`
- `comments`
- `character_drafts`
- `player_access`

### JSON Mode
- `oracle_state`
- `player_access`
- `character_drafts`

## Testing

After applying the fix, test the API endpoints:

```bash
# Test state endpoint
curl https://your-api-url.com/api/state

# Test comments endpoint
curl https://your-api-url.com/api/comments
```

Both should return a 200 OK response instead of 500 Internal Server Error.

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
