# Google OAuth Configuration Fix

## Problem
When trying to authenticate Google Calendar, you get:
- "The connection was reset" when using localhost redirect URI
- "device_id and device_name required for private IP" error (now fixed by removing these parameters)

## Solution: Add Your NAS IP to Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/apis/credentials
2. Sign in with the Google account that created the OAuth credentials

### Step 2: Find Your OAuth 2.0 Client ID

Look for your client ID: `832081443901-tmiit069le5u68ahhcmtcbcakuqiceou.apps.googleusercontent.com`

Click on it to edit.

### Step 3: Add Redirect URI

In the **"Authorized redirect URIs"** section:

**Add this URI:**
```
http://192.168.1.203:3001/api/calendar/auth/callback
```

**Important:**
- Use `http://` (not `https://`)
- Include the port `:3001`
- Include the full path `/api/calendar/auth/callback`
- Must match **exactly** what's in your `.env` file

### Step 4: Save Changes

Click **"SAVE"** at the bottom of the page.

**Note:** Changes may take a few minutes to propagate.

---

## Authentication Process (After Adding URI)

### 1. Update .env on NAS

Make sure your NAS has the updated `.env` file:

```bash
ssh user@omv6.local
nano /home/LumaWall/.env
```

Verify this line:
```
GOOGLE_REDIRECT_URI=http://192.168.1.203:3001/api/calendar/auth/callback
```

### 2. Rebuild Backend Container

```bash
cd /home/LumaWall
docker-compose restart backend
```

### 3. Get Auth URL

```bash
curl http://localhost:3001/api/calendar/auth/url
```

You'll get:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=..."
}
```

### 4. Authorize in Browser

**Copy the `authUrl` value** and open it in any browser (on any device).

**Steps:**
1. Sign in with your Google account
2. Click "Allow" to grant calendar read permissions
3. You'll be redirected to: `http://192.168.1.203:3001/api/calendar/auth/callback?code=...`
4. You should see: **"Successfully authenticated! You can close this window."**

### 5. Verify Tokens Saved

```bash
docker-compose exec backend cat /app/data/tokens.json
```

Should show JSON with `access_token`, `refresh_token`, etc.

### 6. Test Calendar Sync

```bash
# Manual sync
curl -X POST http://localhost:3001/api/calendar/sync

# Check logs
docker-compose logs backend | grep -i sync
```

Should see:
```
✅ Calendar sync complete: XX events synced
```

---

## Troubleshooting

### Still Getting "redirect_uri_mismatch"

**Check that URIs match exactly:**

1. **In Google Cloud Console:**
   - Must have: `http://192.168.1.203:3001/api/calendar/auth/callback`

2. **In NAS .env file:**
   ```bash
   docker-compose exec backend printenv | grep GOOGLE_REDIRECT_URI
   ```
   - Should show: `GOOGLE_REDIRECT_URI=http://192.168.1.203:3001/api/calendar/auth/callback`

3. **If they don't match:**
   - Update `.env` on NAS
   - Restart backend: `docker-compose restart backend`
   - Get new auth URL: `curl http://localhost:3001/api/calendar/auth/url`

### "The connection was reset"

This means the redirect URI isn't reachable:

**Check backend is running:**
```bash
docker-compose ps
```

Backend should be "Up".

**Check backend is accessible:**
```bash
curl http://192.168.1.203:3001/api/calendar/auth/url
```

Should return JSON with authUrl.

**If not accessible:**
- Check port mapping in docker-compose.yml
- Verify firewall allows port 3001
- Try from NAS itself: `curl http://localhost:3001/api/calendar/auth/url`

### "device_id and device_name required"

**This error has been fixed** by removing those parameters from the OAuth URL generation.

If you still see this:
1. Rebuild backend: `docker-compose build --no-cache backend`
2. Restart: `docker-compose up -d backend`
3. Get new auth URL: `curl http://localhost:3001/api/calendar/auth/url`

---

## Alternative: Use Hostname Instead of IP

If your NAS has a hostname (like `omv6.local`), you can use that instead:

**In .env:**
```
GOOGLE_REDIRECT_URI=http://omv6.local:3001/api/calendar/auth/callback
```

**In Google Cloud Console:**
Add: `http://omv6.local:3001/api/calendar/auth/callback`

**Pros:**
- Works even if IP changes
- More memorable

**Cons:**
- Hostname must resolve on all devices you authenticate from
- .local domains may not work on all networks

---

## Summary

1. ✅ Remove `device_id` and `device_name` from OAuth URL (already done in code)
2. ✅ Use NAS IP address as redirect URI (192.168.1.203)
3. ⚠️ **MUST add this URI to Google Cloud Console** (you need to do this)
4. 🔄 Restart backend after updating .env
5. 🔗 Get auth URL and open in browser
6. ✅ Tokens save automatically, sync works forever

**Once authenticated, you never need to do this again!** Tokens persist across restarts.
