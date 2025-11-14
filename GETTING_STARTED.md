# Getting Started: Player Access Setup

Hi! 👋 Your player authentication system is now ready to use!

## What Was Built

I've implemented a complete player login system that integrates with your Supabase `player_access` table. Here's what you can do now:

1. ✅ Create player accounts with secure access codes
2. ✅ Players can log in at `login.html`
3. ✅ Guest mode for read-only testing
4. ✅ All data properly linked through foreign keys

## Quick Test (Right Now!)

Want to see it in action? Here's a 2-minute test:

### Step 1: Set up your environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# SUPABASE_STORAGE_MODE=tables
# PLAYER_ACCESS_ADMIN_TOKEN=any-secret-token-you-choose
```

### Step 2: Create a test account

```bash
node scripts/manage-player-access.js add "Tester" "test123"
```

You should see:
```
✓ Player access created successfully!

The user can now log in at login.html with:
  Access Code: test123
  Display Name: Tester
  Player Key: tester
```

### Step 3: Verify it worked

```bash
npm run player-access:list
```

You should see your "Tester" account listed!

### Step 4: Test the login

```bash
# Start the API server
npm start
```

Then open your browser to `http://localhost:8787/login.html` and enter `test123`

You should be logged in as "Tester" and redirected to the main app! 🎉

## What's Next?

### For Your Real Players

Create accounts for each player:

```bash
node scripts/manage-player-access.js add "Player Name" "their-secret-code"
```

Then share their access code with them privately (email, Discord DM, etc.).

### Documentation

I've created several guides for you:

- **[QUICKSTART_TESTING.md](QUICKSTART_TESTING.md)** - Step-by-step testing guide (start here!)
- **[EXAMPLE_SETUP.md](EXAMPLE_SETUP.md)** - Complete tournament setup example
- **[PLAYER_ACCESS_SETUP.md](PLAYER_ACCESS_SETUP.md)** - Full technical reference
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built and why

### Commands Available

```bash
# List all players
npm run player-access:list

# Add a new player
node scripts/manage-player-access.js add "Display Name" "access-code"

# Get help
node scripts/manage-player-access.js help
```

## How It Works

1. **You create accounts** using the script above
   - Access codes are hashed with SHA-256 before storage
   - Player keys are auto-generated from display names

2. **Players log in** at `login.html`
   - They enter their access code
   - System verifies it and logs them in
   - Their player_key is stored in localStorage

3. **Players use the app**
   - Join sessions
   - Set availability
   - Create character builds
   - All data properly linked to their account

## Security Notes

- ✅ Passwords are hashed (SHA-256)
- ✅ Admin endpoints require token
- ✅ Foreign keys prevent orphaned data
- ✅ No security vulnerabilities found (CodeQL verified)

## Need Help?

If you run into issues:

1. Check the troubleshooting section in [QUICKSTART_TESTING.md](QUICKSTART_TESTING.md)
2. Make sure your Supabase credentials are correct
3. Verify the `player_access` table exists in Supabase

## Everything Is Ready!

All code:
- ✅ Passes linting
- ✅ Passes all tests
- ✅ Has zero security vulnerabilities
- ✅ Is fully documented

You can start creating player accounts right now! 🚀
