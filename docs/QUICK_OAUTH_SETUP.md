# Quick Google OAuth Setup

## The Problem You Just Hit

❌ **"The connection was reset"** - This happened because the redirect URI was set to `localhost`, which doesn't work when authenticating from your browser.

❌ **"device_id and device_name required"** - Fixed by removing those parameters (they're only for mobile apps).

## The Solution (3 Steps)

### Step 1: Add Redirect URI to Google Cloud Console

**Go to:** https://console.cloud.google.com/apis/credentials

**Find and click on:** `832081443901-tmiit069le5u68ahhcmtcbcakuqiceou.apps.googleusercontent.com`

**In "Authorized redirect URIs" section, add:**
```
http://192.168.1.203:3001/api/calendar/auth/callback
```

**Click "SAVE"**

---

### Step 2: Update .env on NAS and Restart Backend

**Your local `.env` file has been updated** with the correct redirect URI.

Now copy it to NAS and restart:

```bash
# Copy .env to NAS
scp /Users/arindam.pal/Projects/LumaWall/.env user@omv6.local:/home/LumaWall/.env

# SSH to NAS and restart backend
ssh user@omv6.local
cd /home/LumaWall
docker-compose restart backend
```

---

### Step 3: Authenticate

**On NAS (via SSH):**
```bash
curl http://localhost:3001/api/calendar/auth/url
```

**Or from your local machine:**
```bash
curl http://192.168.1.203:3001/api/calendar/auth/url
```

**Copy the `authUrl` value and open in browser.**

**After clicking "Allow"**, you'll be redirected to:
```
http://192.168.1.203:3001/api/calendar/auth/callback?code=...
```

You should see:
```
Successfully authenticated! You can close this window.
```

---

### Verify It Worked

```bash
# Check tokens saved
ssh user@omv6.local
docker-compose exec backend cat /app/data/tokens.json

# Test sync
curl -X POST http://192.168.1.203:3001/api/calendar/sync

# Check logs
docker-compose logs backend | tail -20
```

Should see: `✅ Calendar sync complete: XX events synced`

---

## That's It!

Once authenticated, tokens persist forever. Auto-sync runs every 15 minutes automatically.

**For detailed troubleshooting, see:** [GOOGLE_OAUTH_FIX.md](GOOGLE_OAUTH_FIX.md)
