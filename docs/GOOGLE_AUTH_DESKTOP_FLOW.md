# Google Calendar Authentication - Desktop App Flow

## Why This Approach?

The Desktop App OAuth flow is the **correct and easiest way** to authenticate Google Calendar for a headless server like your NAS. Benefits:

 **No redirect URI issues** - No need for public domain, HTTPS, or ngrok
 **One-time setup** - Authenticate once on your laptop, use forever
 **Refresh tokens** - Automatically refreshes, never expires (unless revoked)
 **Simple** - Just run a script, copy one file
 **Secure** - Tokens stored locally, not exposed publicly

## Step-by-Step Setup

### Step 1: Create Desktop App OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials

2. **IMPORTANT:** You may already have a "Web Application" OAuth client. You need to create a **new** "Desktop App" client.

3. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

4. For "Application type", select: **Desktop app**

5. Name it something like: `LumaWall Desktop`

6. Click **"CREATE"**

7. **Download the credentials JSON** or copy:
   - Client ID (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - Client secret (looks like: `GOCSPX-YOUR_CLIENT_SECRET`)

8. **Important:** You do NOT need to add any redirect URIs for Desktop App type!

### Step 2: Update Your .env File

Edit `/Users/arindam.pal/Projects/LumaWall/.env`:

```env
GOOGLE_CLIENT_ID=your_new_desktop_app_client_id
GOOGLE_CLIENT_SECRET=your_new_desktop_app_client_secret
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
```

**Note:** The redirect URI `urn:ietf:wg:oauth:2.0:oob` is a special value for Desktop App flow (OOB = Out Of Band).

### Step 3: Run Authentication Script on Your Laptop

**On your MacBook (not on NAS):**

```bash
cd /Users/arindam.pal/Projects/LumaWall

# Install dependencies if needed
npm install

# Run authentication helper
node authenticate-google.js
```

**What happens:**

1. Script reads your `.env` file
2. Generates an authorization URL
3. Opens your browser to Google's consent screen
4. You sign in and authorize calendar access
5. Google shows you an authorization code
6. You paste the code back into the terminal
7. Script exchanges code for access + refresh tokens
8. Saves tokens to `backend/data/tokens.json`
9. Tests the connection by listing your calendars

**Example output:**

```
============================================================
Google Calendar Authentication Helper
============================================================

 Loaded OAuth credentials from .env
  Client ID: 123456789-abcdefg...

 Step 1: Authorize this app
────────────────────────────────────────────────────────────

Open this URL in your browser:

https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...

After authorizing, Google will show you an authorization code.

 Paste the authorization code here: 4/0AY0e-g5...

 Exchanging code for tokens...
 Successfully obtained tokens!

Token details:
  - Access Token:  Present
  - Refresh Token:  Present
  - Expiry Date: 1/15/2025, 3:45:00 PM

 Created data directory: backend/data
 Saved tokens to: backend/data/tokens.json

 Testing tokens by fetching calendar list...
 Successfully connected to Google Calendar!

Found calendars:
  1. Primary (your.email@gmail.com)
  2. Family Calendar (family@group.calendar.google.com)

============================================================
 Authentication Complete!
============================================================
```

### Step 4: Copy Tokens to NAS

```bash
# From your laptop, copy tokens.json to NAS
scp backend/data/tokens.json user@omv6.local:/home/LumaWall/backend/data/
```

### Step 5: Verify Docker Volume Mount

Make sure your `docker-compose.yml` has the data volume mount:

```yaml
services:
  backend:
    volumes:
      - /srv/mergerfs/Mediapool/Photos/Magic:/app/photos:ro
      - ./backend/data:/app/data  # ← This line must be present!
```

If you need to add it:

```bash
# SSH to NAS
ssh user@omv6.local

# Edit docker-compose.yml
nano /home/LumaWall/docker-compose.yml

# Add the volume mount under backend service
# Save and exit (Ctrl+X, Y, Enter)
```

### Step 6: Restart Backend

```bash
ssh user@omv6.local "cd /home/LumaWall && docker-compose restart backend"
```

### Step 7: Verify It's Working

**Check logs:**

```bash
ssh user@omv6.local "cd /home/LumaWall && docker-compose logs backend | tail -20"
```

You should see:

```
 Loaded OAuth tokens from file
Setting up calendar auto-sync: every 15 minutes
 Running scheduled calendar sync...
 Calendar sync complete: 25 events synced
```

**Manually trigger a sync to test:**

```bash
ssh user@omv6.local "curl -X POST http://localhost:3001/api/calendar/sync"
```

Should return:

```json
{
  "success": true,
  "totalEvents": 25,
  "calendars": ["primary"]
}
```

---

## How It Works

### Desktop App OAuth Flow

1. **One-time authorization** (on your laptop):
   - User clicks authorization URL
   - Signs in to Google
   - Grants calendar read permission
   - Google shows authorization code
   - App exchanges code for tokens

2. **Token structure:**
   ```json
   {
     "access_token": "ya29.a0AfH6...",  // Short-lived (1 hour)
     "refresh_token": "1//0gHj...",      // Long-lived (never expires)
     "scope": "https://www.googleapis.com/auth/calendar.readonly",
     "token_type": "Bearer",
     "expiry_date": 1673816700000
   }
   ```

3. **Automatic refresh:**
   - When access token expires, googleapis library automatically uses refresh token to get new access token
   - No user interaction needed
   - Works indefinitely unless you revoke access

4. **Persistence:**
   - Tokens saved to `backend/data/tokens.json`
   - Volume mounted into Docker container
   - Loaded on backend startup
   - Survives container restarts, system reboots

### Why This Works on NAS

- **No browser needed on NAS** - Authentication happens on your laptop
- **No public URL needed** - OOB flow doesn't use redirect URIs
- **No firewall issues** - Backend only makes outbound HTTPS requests to Google
- **No recurring auth** - Refresh token keeps working

---

## Troubleshooting

### "Missing Google OAuth credentials"

**Problem:** Script can't find GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET

**Solution:**
1. Make sure you have a `.env` file in the project root
2. Check that values are set (no quotes needed)
3. Make sure you're using Desktop App credentials, not Web Application

### "Error 400: redirect_uri_mismatch"

**Problem:** You're using Web Application OAuth client instead of Desktop App

**Solution:**
1. Go to Google Cloud Console
2. Create a **new** OAuth client with type "Desktop app"
3. Use the new Client ID and Secret in .env

### "Error exchanging code for tokens"

**Problem:** Authorization code invalid or expired

**Solution:**
1. Authorization codes expire after a few minutes
2. Generate a new auth URL
3. Get a new code
4. Paste it immediately

### "No saved OAuth tokens found" in backend logs

**Problem:** tokens.json not found by backend

**Solution:**
1. Check file exists: `ssh user@omv6.local "ls -la /home/LumaWall/backend/data/"`
2. Check permissions: `ssh user@omv6.local "cat /home/LumaWall/backend/data/tokens.json"`
3. Check volume mount in docker-compose.yml
4. Restart backend: `docker-compose restart backend`

### "Calendar not initialized. Please authenticate first."

**Problem:** Backend loaded but tokens are invalid or missing

**Solution:**
1. Check token file exists and is valid JSON
2. Re-run authentication script to get fresh tokens
3. Copy new tokens.json to NAS
4. Restart backend

### Calendar sync not running automatically

**Problem:** Cron job not starting

**Solution:**
1. Check logs: `docker-compose logs backend | grep "Setting up calendar auto-sync"`
2. Should see: `Setting up calendar auto-sync: every 15 minutes`
3. If not, check SYNC_INTERVAL in .env
4. Restart backend

---

## Comparison: Old vs New Approach

###  Old Approach (Web Application Flow)
- Required redirect URI with public domain or IP
- Google rejects private IPs
- Needed ngrok or public DNS
- Complex setup with port forwarding
- Redirect URI mismatch errors
- Required browser on NAS or SSH tunneling

###  New Approach (Desktop App Flow)
- No redirect URI needed (uses OOB)
- No public domain needed
- No ngrok needed
- Simple one-time auth on laptop
- Just copy one file to NAS
- Works forever with refresh token

---

## Security Notes

### Is This Secure?

 **Yes**, because:
- Tokens are stored locally, not transmitted over network
- Backend only makes HTTPS requests to Google APIs
- Refresh token is encrypted in transit to Google
- Access token expires every hour, automatically refreshed
- You can revoke access anytime from Google account settings

### Revoking Access

If you want to revoke access:

1. Go to: https://myaccount.google.com/permissions
2. Find "LumaWall Desktop" (or whatever you named it)
3. Click "Remove access"
4. Delete tokens.json from NAS
5. Backend will stop syncing until you re-authenticate

---

## Files Involved

```
LumaWall/
├── authenticate-google.js          # Helper script (run on laptop)
├── .env                             # Contains Client ID & Secret
└── backend/
    ├── data/
    │   └── tokens.json             # OAuth tokens (copy to NAS)
    └── src/
        └── services/
            └── calendarService.js  # Loads tokens on startup
```

---

## Summary

1.  Create **Desktop App** OAuth client in Google Cloud Console
2.  Update `.env` with new credentials
3.  Run `node authenticate-google.js` on your laptop
4.  Copy `backend/data/tokens.json` to NAS
5.  Restart backend container
6.  Calendar auto-sync works forever!

**No redirect URIs. No ngrok. No hassle. Just works!** 
