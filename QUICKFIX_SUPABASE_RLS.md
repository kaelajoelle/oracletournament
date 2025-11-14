# Quick Fix Guide: Supabase Permission Denied Error

## Symptoms
- Getting 500 Internal Server Error when accessing `/api/state` or `/api/comments`
- Error message contains: `permission denied for table roster_extras` or similar
- Error code: `42501` (PostgreSQL insufficient privilege error)

## Quick Fix (5 minutes)

### Step 1: Identify Your Storage Mode
Check your `.env` file for `SUPABASE_STORAGE_MODE`:
- If it's `tables`, use **Option A**
- If it's `json` or not set, use **Option B**

### Step 2: Apply the Fix

**Option A - Tables Mode:**
1. Open your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase/fix_rls_policies.sql`
3. Paste and execute
4. Verify success (should show 9 policies updated)

**Option B - JSON Mode:**
1. Open your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase/fix_rls_policies_json_mode.sql`
3. Paste and execute
4. Verify success (should show 3 policies updated)

### Step 3: Test
```bash
# Test your API (replace with your URL)
curl https://your-api-url.com/api/state

# Should return 200 OK with JSON data instead of 500 error
```

## What This Fixes
The original RLS policies used `auth.role()` which doesn't work with REST API requests. The fix changes them to use `auth.jwt() ->> 'role'` which correctly evaluates the JWT token's role claim.

## Need Help?
See `supabase/RLS_FIX_README.md` for detailed information about:
- Root cause analysis
- What changed
- Affected tables
- Testing procedures
- Additional resources

## For New Installations
If you're setting up a fresh Supabase instance, the schema files (`oracle_tables.sql` or `oracle_state.sql`) already include the correct policies. Just run them as documented in the main README.
