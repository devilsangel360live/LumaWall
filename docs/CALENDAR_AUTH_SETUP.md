# Calendar Authentication Setup

## Overview

The calendar auto-sync now includes **token persistence**, which means OAuth tokens are saved to disk and reloaded when the backend restarts.

## How It Works

```
1. You authenticate with Google Calendar (one-time)
   ↓
2. Backend receives OAuth tokens
   ↓
3. Tokens saved to: /app/data/tokens.json
   ↓
4. Backend restarts? No problem!
   ↓
5. Tokens automatically reloaded on startup
   ↓
6. Auto-sync works immediately 
```

## First-Time Setup

### 1. Start Backend

```bash
cd /home/LumaWall
docker-compose up -d
```

### 2. Get Authorization URL

Visit in your browser:
```
http://192.168.1.203:3001/api/calendar/auth/url
```

**Or use curl:**
```bash
curl http://192.168.1.203:3001/api/calendar/auth/url
```

You'll get a response like:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 3. Authorize the App

1. Copy the `authUrl` and open it in a browser
2. Sign in with your Google account
3. Grant calendar read permissions
4. You'll be redirected back to: `http://192.168.1.203:3001/api/calendar/auth/callback?code=...`
5. You should see: **"Successfully authenticated! You can close this window."**

### 4. Verify Tokens Were Saved

Check backend logs:
```bash
docker-compose logs backend | tail -20
```

**Look for:**
```
 Saved OAuth tokens to file
```

### 5. Verify Auto-Sync is Working

Wait 15 minutes, or manually trigger:
```bash
curl -X POST http://192.168.1.203:3001/api/calendar/sync
```

**Check logs:**
```bash
docker-compose logs backend | grep sync
```

**Should see:**
```
 Running scheduled calendar sync...
 Calendar sync complete: 42 events synced
```

## Token Persistence Details

### Where Are Tokens Stored?

**Inside container:** `/app/data/tokens.json`
**On NAS (volume mount):** `./backend/data/tokens.json`

Because of the volume mount in docker-compose.yml:
```yaml
volumes:
  - ./backend/data:/app/data
```

Tokens persist across:
-  Container restarts
-  Backend crashes
-  NAS reboots
-  Docker updates

### What's in tokens.json?

```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//0g...",
  "scope": "https://www.googleapis.com/auth/calendar.readonly",
  "token_type": "Bearer",
  "expiry_date": 1705123456789
}
```

**Security:**
- File is in `backend/data/` which is **NOT** in git
- Only backend container can access it
- Tokens expire and auto-refresh (Google handles this)

## Troubleshooting

### Problem: Auto-sync not working

**Check 1: Are tokens loaded?**
```bash
docker-compose logs backend | grep "Loaded OAuth tokens"
```

**Expected:** ` Loaded OAuth tokens from file`

**If you see:** `  No saved OAuth tokens found`
- Tokens file doesn't exist
- Need to authenticate (steps 2-4 above)

**Check 2: Does tokens.json exist?**
```bash
docker-compose exec backend ls -la /app/data/
```

**Should show:** `tokens.json`

**If missing:**
- Authentication was never completed
- Or file permissions issue

**Check 3: Can backend read the file?**
```bash
docker-compose exec backend cat /app/data/tokens.json
```

**Should show:** JSON with access_token, refresh_token, etc.

### Problem: "Calendar not initialized" error

**Cause:** No OAuth tokens loaded

**Solution:**
1. Authenticate following steps 2-4
2. Restart backend: `docker-compose restart backend`
3. Check logs for "Loaded OAuth tokens"

### Problem: Tokens expired

**Google tokens expire after 1 hour**, but refresh tokens last indefinitely.

**Automatic refresh:**
- Google APIs automatically refresh tokens when needed
- You don't need to do anything
- Refresh token is used to get new access tokens

**Manual refresh (if needed):**
Just re-authenticate (steps 2-4). Old tokens will be overwritten.

### Problem: Multiple calendars not syncing

**Check enabled calendars:**
```bash
curl http://192.168.1.203:3001/api/calendar/calendars
```

**Enable calendars via UI or database:**
```sql
-- Inside backend container
sqlite3 /app/data/calendar.db

-- See all calendars
SELECT * FROM calendars;

-- Enable a calendar
UPDATE calendars SET enabled = 1 WHERE id = 'calendar_id_here';
```

### Problem: Permission denied errors

**Cause:** File permissions on tokens.json

**Fix:**
```bash
# On NAS
sudo chown -R 1000:1000 /home/LumaWall/backend/data/
sudo chmod 644 /home/LumaWall/backend/data/tokens.json
```

## Re-authentication

### When Do You Need to Re-Authenticate?

-  First time setup
-  If you revoke app access in Google settings
-  If tokens.json is deleted
-  NOT after backend restarts (tokens are persistent!)
-  NOT when tokens expire (auto-refreshed)

### How to Re-Authenticate

1. Delete old tokens:
   ```bash
   docker-compose exec backend rm /app/data/tokens.json
   ```

2. Restart backend:
   ```bash
   docker-compose restart backend
   ```

3. Follow setup steps 2-4 again

## Security Considerations

### Is It Safe to Store Tokens?

**Yes, with caveats:**
-  Tokens are stored locally on your NAS
-  Not transmitted over network
-  Only backend has access
-  Google can revoke tokens anytime
-  Anyone with NAS access can read tokens
-  Tokens grant read-only calendar access

### Best Practices:

1. **Protect your NAS:**
   - Use strong passwords
   - Keep SSH access secure
   - Don't expose NAS to internet

2. **Use read-only scope:**
   - App only requests calendar.readonly
   - Cannot modify or delete events
   - Cannot access other Google services

3. **Revoke access if needed:**
   - Go to: https://myaccount.google.com/permissions
   - Find "LumaWall" (or your app name)
   - Click "Remove Access"

4. **Regular monitoring:**
   - Check backend logs for unusual activity
   - Monitor Google account security alerts

## Advanced: Manual Token Management

### View Current Tokens

```bash
docker-compose exec backend cat /app/data/tokens.json | jq .
```

### Backup Tokens

```bash
# On NAS
cp /home/LumaWall/backend/data/tokens.json /home/LumaWall/backend/data/tokens.json.backup
```

### Restore Tokens

```bash
# On NAS
cp /home/LumaWall/backend/data/tokens.json.backup /home/LumaWall/backend/data/tokens.json
docker-compose restart backend
```

### Check Token Expiry

```bash
docker-compose exec backend node -e "
const tokens = require('/app/data/tokens.json');
const expiry = new Date(tokens.expiry_date);
console.log('Token expires:', expiry);
console.log('Expired?', expiry < new Date());
"
```

## Summary

 **One-time authentication** - Authenticate once, works forever
 **Automatic token refresh** - Google handles token expiration
 **Survives restarts** - Tokens persist across all restarts
 **Auto-sync enabled** - Syncs every 15 minutes automatically
 **Secure storage** - Tokens stored locally on your NAS
 **Easy re-authentication** - Simple steps to re-auth if needed

**After initial setup, calendar sync is fully automatic!**
