# Example: Setting Up Player Access for Your Tournament

This is a complete example showing how to set up player access codes for a tournament with 6 players.

## Scenario

You're running an Oracle Tournament with the following players:
- Kaela (DM/Organizer)
- Alice
- Bob
- Charlie
- Diana
- Eve
- Tester (for testing)

## Step-by-Step Setup

### 1. Configure Environment

Create your `.env` file:

```bash
# Get these from your Supabase project dashboard
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_MODE=tables
PLAYER_ACCESS_ADMIN_TOKEN=my-super-secret-admin-token-12345
```

Validate your configuration:
```bash
npm run validate:env
```

### 2. Create Player Accounts

Run these commands to create access codes for all players:

```bash
# DM account (you!)
node scripts/manage-player-access.js add "Kaela" "kaela-dm-2024"

# Player accounts
node scripts/manage-player-access.js add "Alice" "alice-magic-sword"
node scripts/manage-player-access.js add "Bob" "bob-warrior-shield"
node scripts/manage-player-access.js add "Charlie" "charlie-rogue-dagger"
node scripts/manage-player-access.js add "Diana" "diana-cleric-staff"
node scripts/manage-player-access.js add "Eve" "eve-wizard-tome"

# Test account for verification
node scripts/manage-player-access.js add "Tester" "test123"
```

### 3. Verify All Accounts

```bash
npm run player-access:list
```

Expected output:
```
Player Access Records:
────────────────────────────────────────────────────────────────────────────────
1. Alice (alice)
   Created: 2025-11-14T02:00:00.000Z
   Last Login: Never
2. Bob (bob)
   Created: 2025-11-14T02:00:01.000Z
   Last Login: Never
3. Charlie (charlie)
   Created: 2025-11-14T02:00:02.000Z
   Last Login: Never
4. Diana (diana)
   Created: 2025-11-14T02:00:03.000Z
   Last Login: Never
5. Eve (eve)
   Created: 2025-11-14T02:00:04.000Z
   Last Login: Never
6. Kaela (kaela)
   Created: 2025-11-14T02:00:05.000Z
   Last Login: Never
7. Tester (tester)
   Created: 2025-11-14T02:00:06.000Z
   Last Login: Never
────────────────────────────────────────────────────────────────────────────────
Total: 7 player(s)
```

### 4. Test Login Flow

Start the servers:
```bash
npm start    # API server on port 8787
```

In another terminal:
```bash
npm run dev  # Frontend dev server on port 4173
```

Visit `http://localhost:4173/login.html` and test:

1. **Test Account Login**
   - Enter: `test123`
   - Should login as "Tester"
   
2. **Guest Mode**
   - Click "Continue as guest"
   - Should get read-only access

### 5. Share Access Codes with Players

Send each player their personal access code privately:

**Email Template:**
```
Subject: Oracle Tournament - Your Access Code

Hi [Player Name],

Your access code for the Oracle Tournament character builder is: [access-code]

Visit: https://your-tournament-site.com/login.html
Enter your code to access the builder.

See you at the tournament!
- Kaela
```

**Example Messages:**
- To Alice: "Your access code is: `alice-magic-sword`"
- To Bob: "Your access code is: `bob-warrior-shield`"
- etc.

### 6. Monitor Player Logins

After sharing codes, check who has logged in:

```bash
npm run player-access:list
```

Players who logged in will show a `Last Login` timestamp:
```
1. Alice (alice)
   Created: 2025-11-14T02:00:00.000Z
   Last Login: 2025-11-14T15:30:22.000Z  ← Logged in!
2. Bob (bob)
   Created: 2025-11-14T02:00:01.000Z
   Last Login: Never  ← Not logged in yet
```

## Using the Admin API (Optional)

If you prefer to create accounts programmatically:

```bash
# Create account via API
curl -X POST http://localhost:8787/api/admin/player-access \
  -H "Content-Type: application/json" \
  -d '{
    "adminToken": "my-super-secret-admin-token-12345",
    "displayName": "New Player",
    "accessCode": "new-player-code"
  }'

# List accounts via API
curl "http://localhost:8787/api/admin/player-access?token=my-super-secret-admin-token-12345"
```

## Security Tips

1. **Use Strong Access Codes**
   - Bad: `alice`, `123`, `password`
   - Good: `alice-magic-sword`, `bob-warrior-shield`, `charlie-rogue-dagger`
   - Great: `alice-MGc7pX2k`, `bob-9Kf3nQw1`, `charlie-4Hj8tLm5`

2. **Keep Codes Private**
   - Send via DM, email, or encrypted message
   - Never post in public channels
   - Don't share access codes between players

3. **Secure Your Admin Token**
   - Never commit `.env` to git
   - Use different tokens for dev/prod
   - Rotate if compromised

4. **Monitor Access**
   - Regularly check `npm run player-access:list`
   - Verify expected login patterns
   - Investigate unexpected logins

## Troubleshooting Common Issues

### Player can't log in
- Verify code was typed correctly (case doesn't matter)
- Check account exists: `npm run player-access:list`
- Try guest mode to verify server is working

### Need to reset a player's code
1. Delete from Supabase (SQL Editor):
   ```sql
   DELETE FROM player_access WHERE player_key = 'alice';
   ```
2. Create new code:
   ```bash
   node scripts/manage-player-access.js add "Alice" "alice-new-code-2024"
   ```

### Accidentally created duplicate
Player keys are unique. If you need to change a display name:
1. Delete old record from Supabase
2. Create new one with correct name

## What's Next?

Once players can log in:
- They can set their availability for sessions
- They can create/edit their character builds
- They can join sessions
- They can see who else is playing

All data is stored in Supabase and synced across all users in real-time!
