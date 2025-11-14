# Quick Start: Testing Player Access

This guide walks you through setting up and testing a player access account.

## Step 1: Configure Supabase

1. Make sure you've run the Supabase schema setup:
   ```bash
   # Option A: Use the bootstrap script (if using oracle_state.sql)
   npm run supabase:bootstrap
   
   # Option B: Or manually run oracle_tables.sql in Supabase SQL Editor
   # Copy/paste the contents of supabase/oracle_tables.sql
   ```

2. Create a `.env` file with your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_STORAGE_MODE=tables
   PLAYER_ACCESS_ADMIN_TOKEN=my-secret-admin-token
   ```

## Step 2: Create a Test Account

Run the script to create a test player:

```bash
node scripts/manage-player-access.js add "Tester" "test123"
```

You should see output like:

```
Creating player access for "Tester"...
Player Key: tester
Access Code: test123

✓ Player access created successfully!

The user can now log in at login.html with:
  Access Code: test123
  Display Name: Tester
  Player Key: tester
```

## Step 3: Verify the Account

List all player accounts to confirm:

```bash
npm run player-access:list
```

Output:
```
Player Access Records:
────────────────────────────────────────────────────────────────────────────────
1. Tester (tester)
   Created: 2025-11-14T01:51:04.994Z
   Last Login: Never
────────────────────────────────────────────────────────────────────────────────
Total: 1 player(s)
```

## Step 4: Test the Login Flow

1. Start the development server:
   ```bash
   npm run dev
   ```
   This starts both the API server (port 8787) and the frontend dev server (port 4173).

2. In a new terminal, start the API server:
   ```bash
   npm start
   ```

3. Open your browser to: `http://localhost:4173/login.html`

4. Enter the access code: `test123`

5. Click "Continue"

6. You should see:
   - Success message: "Welcome, Tester! Redirecting…"
   - Redirect to `index.html`
   - The main application loads with "Tester" as the logged-in user

## Step 5: Verify Guest Mode

1. Clear localStorage or use incognito mode
2. Go to `http://localhost:4173/login.html`
3. Click "Continue as guest"
4. You should be logged in with read-only access (no edit capabilities)

## Creating Real Player Accounts

Once you've verified the test account works, create accounts for your real players:

```bash
# Example player accounts
node scripts/manage-player-access.js add "Alice Smith" "alice-secret-2024"
node scripts/manage-player-access.js add "Bob Jones" "bob-pass-xyz"
node scripts/manage-player-access.js add "Kaela" "kaela-dm-code"
```

Then share each player's access code with them privately (email, Discord DM, etc.).

## Security Best Practices

- **Never commit `.env`** - It's already in `.gitignore`
- **Use strong access codes** - Mix letters, numbers, and special characters
- **Keep admin token secret** - Only use it server-side
- **One code per player** - Don't share access codes between users
- **Rotate codes if leaked** - Delete and recreate the player access record

## Troubleshooting

### "Personal access codes are not enabled on this server"

Make sure your `.env` has:
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### "Invalid access code"

- Access codes are case-insensitive
- Check for typos
- Verify the account exists: `npm run player-access:list`
- Try recreating: delete from Supabase UI, then run the add command again

### "Player with key already exists"

The player_key is generated from the display name. Either:
- Use a different display name
- Delete the existing record from Supabase
- Or modify the existing record's access code hash manually

### Can't connect to Supabase

- Check your `SUPABASE_URL` format: `https://xyz.supabase.co`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service role** key, not the anon key
- Check Supabase dashboard to ensure the `player_access` table exists

## Next Steps

- Read [PLAYER_ACCESS_SETUP.md](PLAYER_ACCESS_SETUP.md) for detailed documentation
- See [supabase/SCHEMA_DOCUMENTATION.md](supabase/SCHEMA_DOCUMENTATION.md) to understand the database structure
- Check the API summary in [README.md](README.md) for all available endpoints
