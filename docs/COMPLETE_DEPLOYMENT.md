# Complete Deployment Guide - All Fixes

This guide consolidates **all fixes** from the recent development session into a single deployment process.

## What's Been Fixed

### 1. Weather Panel Updates
-  Fixed temperature units (now shows °F correctly)
-  Changed forecast labels from day names to dates (Jan 12, Jan 13, etc.)
-  Added dynamic weather-based color gradients
-  Extracted real sunrise/sunset times from NOAA forecast
-  Confirmed humidity, visibility, and cloud cover are working

### 2. Calendar Auto-Sync
-  Implemented OAuth token persistence to disk
-  Enabled cron job for automatic sync every 15 minutes
-  Tokens survive container restarts
-  Added environment variable configuration

### 3. Google OAuth Authentication
-  Fixed private IP authentication error
-  Changed redirect URI to localhost
-  Added device_id/device_name parameters
-  Created comprehensive troubleshooting guide

### 4. Photo Serving
-  Fixed nginx location priority
-  Added detailed logging
-  Removed unsupported HEIC/HEIF formats

### 5. MapTiler Map Loading
-  Fixed map initialization timing issues
-  Added mapContainerReady state detection

### 6. Memory Leak Fixes
-  Fixed image preloading cleanup
-  Added 6-hour auto-refresh

### 7. Docker Configuration
-  Proper environment variable setup
-  Volume mounts for data persistence

---

## Deployment Steps

### Step 1: Copy Updated Files to NAS

From your local machine:

```bash
# Copy all files except sensitive data
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/data' \
  --exclude '.env' \
  /Users/arindam.pal/Projects/LumaWall/ \
  user@omv6.local:/home/LumaWall/
```

**Note:** `.env` is gitignored and won't copy. We'll create it manually next.

---

### Step 2: Create .env File on NAS

SSH to your NAS:

```bash
ssh user@omv6.local
```

Navigate to LumaWall directory:

```bash
cd /home/LumaWall
```

Create .env file:

```bash
nano .env
```

Paste this content:

```env
# LumaWall Docker Environment Configuration

# ===== Frontend Configuration =====
# MapTiler API Key for weather maps
VITE_MAPTILER_API_KEY=likPSlRJ1hqJaNrNRo1L

# ===== Backend Configuration =====
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=832081443901-tmiit069le5u68ahhcmtcbcakuqiceou.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET

# Redirect URI - Using localhost to avoid Google OAuth private IP restrictions
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/auth/callback

# Calendar Sync Configuration (in minutes)
SYNC_INTERVAL=15
```

Save with **Ctrl+X**, then **Y**, then **Enter**.

Verify file was created:

```bash
cat .env
```

---

### Step 3: Rebuild and Start Containers

Still on NAS:

```bash
cd /home/LumaWall

# Stop old containers
docker-compose down

# Build with all updates (no cache to ensure fresh build)
docker-compose build --no-cache

# Start containers
docker-compose up -d
```

---

### Step 4: Verify Environment Variables

Check that environment variables are set correctly:

```bash
# Check SYNC_INTERVAL
docker-compose exec backend printenv | grep SYNC_INTERVAL

# Expected: SYNC_INTERVAL=15

# Check Google credentials
docker-compose exec backend printenv | grep GOOGLE

# Expected:
# GOOGLE_CLIENT_ID=832081443901-...
# GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET...
# GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/auth/callback
```

---

### Step 5: Authenticate Google Calendar (One-Time Setup)

**From NAS SSH session:**

```bash
# Get authorization URL
curl http://localhost:3001/api/calendar/auth/url
```

You'll get a JSON response like:

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Copy the `authUrl` value and open it in a browser** (can be from any device):

1. Sign in with your Google account
2. Grant calendar read permissions
3. You'll be redirected to: `http://localhost:3001/api/calendar/auth/callback?code=...`
4. You should see: **"Successfully authenticated! You can close this window."**

**Verify tokens were saved:**

```bash
docker-compose exec backend cat /app/data/tokens.json
```

Should show JSON with `access_token`, `refresh_token`, etc.

**Check backend logs:**

```bash
docker-compose logs backend | grep -i "saved oauth tokens"
```

Should see: ` Saved OAuth tokens to file`

---

### Step 6: Verify Calendar Auto-Sync

**Wait 15 minutes**, or manually trigger sync:

```bash
curl -X POST http://localhost:3001/api/calendar/sync
```

**Check logs:**

```bash
docker-compose logs backend | grep sync
```

Should see:

```
Setting up calendar auto-sync: every 15 minutes
 Running scheduled calendar sync...
 Calendar sync complete: XX events synced
```

---

### Step 7: Verify Photo Display

**From your browser, navigate to:**

```
http://192.168.1.203
```

**Check:**
- Photos should display (not black rectangles)
- Filenames should be visible
- Slideshow and collage should work

**If photos still black, check backend logs:**

```bash
docker-compose logs backend | grep "Serving photo"
```

Should see entries like:

```
Serving photo: Photos/2024/IMG_1234.jpg -> /app/photos/Photos/2024/IMG_1234.jpg
```

**If you see 404 errors:**

```bash
# Check volume mount
docker-compose exec backend ls -la /app/photos/

# Should show your photo directories
```

---

### Step 8: Test Weather Panel Updates

**Navigate to weather screen** (click weather icon or screen 5):

**Verify:**
-  Temperatures show °F (not °C)
-  Forecast shows dates (Jan 12, Jan 13) not day names
-  Background gradient changes based on weather/temperature
-  Sunrise/sunset show actual times (not hardcoded)
-  Humidity, visibility, cloud cover display

---

### Step 9: Test MapTiler Map Loading

**On weather screen, check browser console** (F12):

**Should see:**

```
Map container NOW available
Map container ready, initializing map...
```

**Verify:**
-  Map tiles load
-  Weather layer toggle buttons work (Temperature, Precipitation, Wind, Clouds)
-  No errors in console about map container

**If map doesn't load:**

```bash
# Check frontend logs
docker-compose logs frontend

# Verify MapTiler key is in built assets
docker-compose exec frontend sh -c 'grep -o "likPSlRJ1h" /usr/share/nginx/html/assets/*.js | head -1'

# Should output: likPSlRJ1h
```

---

### Step 10: Monitor for Memory Leaks

**Let the display run for several hours.**

**Check memory usage periodically:**

```bash
# On NAS
docker stats

# Look at frontend container memory usage
```

**Expected behavior:**
- Memory should stabilize after initial load
- Auto-refresh occurs every 6 hours
- Image preloading cleans up properly

---

## Troubleshooting

### Problem: Calendar sync not working

**Check 1: Are tokens loaded?**

```bash
docker-compose logs backend | grep "Loaded OAuth tokens"
```

Expected: ` Loaded OAuth tokens from file`

If you see: `  No saved OAuth tokens found`
- Need to authenticate (Step 5)

**Check 2: Does tokens.json exist?**

```bash
docker-compose exec backend ls -la /app/data/
```

Should show: `tokens.json`

**Check 3: Is cron job running?**

```bash
docker-compose logs backend | grep "Setting up calendar auto-sync"
```

Expected: `Setting up calendar auto-sync: every 15 minutes`

---

### Problem: Photos still black rectangles

**Check 1: Nginx configuration**

```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api"
```

Should show `/api` location **before** static assets caching.

**Check 2: Backend can access photos**

```bash
docker-compose exec backend ls -la /app/photos/
```

Should list your photo directories.

**Check 3: Photo path in logs**

```bash
docker-compose logs backend --tail 50 | grep "Serving photo"
```

Should show correct paths being served.

---

### Problem: Map not loading

**Check 1: Container ready state**

Open browser console (F12) and look for:

```
Map container NOW available
Map container ready, initializing map...
```

**Check 2: MapTiler key**

```bash
# Verify key is in built assets
docker-compose exec frontend sh -c 'grep -o "likPSlRJ1h" /usr/share/nginx/html/assets/*.js | head -1'
```

Should output: `likPSlRJ1h`

**Check 3: Frontend rebuild**

```bash
# Rebuild frontend only
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

### Problem: Environment variables not set

**Check .env file location:**

```bash
# Must be in same directory as docker-compose.yml
ls -la /home/LumaWall/.env
```

**Verify docker-compose reads it:**

```bash
docker-compose config | grep SYNC_INTERVAL
```

Should show: `- SYNC_INTERVAL=15`

**If not showing:**
- .env file missing → Create it (Step 2)
- .env file in wrong location → Move to /home/LumaWall/
- Syntax error → Check no quotes around values

---

### Problem: "redirect_uri_mismatch" error during OAuth

**Check .env file:**

```bash
cat /home/LumaWall/.env | grep REDIRECT_URI
```

Should be: `GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/auth/callback`

**Check Google Cloud Console:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Check **Authorized redirect URIs**
4. Should include: `http://localhost:3001/api/calendar/auth/callback`

**If not matching:**
- Add the redirect URI in Google Cloud Console
- Make sure it matches **exactly** (including http/https, port, path)

---

## Verification Checklist

After deployment, verify all features:

### Weather Panel
- [ ] Temperature shows °F
- [ ] Forecast shows dates (not day names)
- [ ] Background gradient changes with weather
- [ ] Sunrise/sunset show actual times
- [ ] Humidity displays
- [ ] Visibility displays
- [ ] Cloud cover displays

### Calendar
- [ ] OAuth tokens saved to `/app/data/tokens.json`
- [ ] Auto-sync runs every 15 minutes
- [ ] Events display on calendar widget
- [ ] Sync persists after container restart

### Photos
- [ ] Images display (not black rectangles)
- [ ] Slideshow works
- [ ] Collage works
- [ ] No 404 errors in browser console

### Map
- [ ] MapTiler map loads on weather screen
- [ ] Weather layer toggle buttons work
- [ ] No console errors about map container

### Memory
- [ ] Memory usage stabilizes after initial load
- [ ] Auto-refresh occurs every 6 hours
- [ ] No memory leaks over extended running

### Environment
- [ ] All environment variables set in backend container
- [ ] SYNC_INTERVAL=15
- [ ] Google credentials present
- [ ] MapTiler key present

---

## Quick Reference Commands

### View Logs

```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 50 lines
docker-compose logs --tail 50

# Filter for calendar
docker-compose logs backend | grep -i calendar

# Filter for sync
docker-compose logs backend | grep sync
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend

# Restart frontend only
docker-compose restart frontend
```

### Rebuild Services

```bash
# Rebuild all
docker-compose build --no-cache
docker-compose up -d

# Rebuild backend only
docker-compose build --no-cache backend
docker-compose up -d backend

# Rebuild frontend only
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Check Container Status

```bash
# List containers
docker-compose ps

# Container details
docker-compose exec backend printenv

# Container logs
docker-compose logs backend --tail 20
```

### Access Container Shell

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

---

## Configuration Changes

### Change Calendar Sync Interval

**Edit .env on NAS:**

```bash
nano /home/LumaWall/.env

# Change line:
SYNC_INTERVAL=5  # Every 5 minutes

# Restart backend
docker-compose restart backend
```

### Update Google Credentials

```bash
nano /home/LumaWall/.env

# Update values:
GOOGLE_CLIENT_ID=new_value
GOOGLE_CLIENT_SECRET=new_value

# Restart backend
docker-compose restart backend
```

### Change MapTiler API Key

```bash
nano /home/LumaWall/.env

# Update:
VITE_MAPTILER_API_KEY=new_key

# Rebuild frontend (build-time variable)
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## Summary

**All fixes deployed in this session:**

1.  Weather panel: °F display, date labels, dynamic gradients, sunrise/sunset
2.  Calendar auto-sync: Token persistence, 15-min cron job
3.  Google OAuth: Localhost redirect, device_id/device_name
4.  Photo serving: Nginx location priority fix
5.  MapTiler map: Container ready state detection
6.  Memory leaks: Image cleanup, 6-hour auto-refresh
7.  Environment variables: Proper .env configuration

**After deployment, your LumaWall will:**
- Display accurate weather with beautiful gradients
- Auto-sync calendar every 15 minutes
- Show photos correctly
- Display weather map
- Run stably without memory leaks

**One-time setup required:**
- Create .env file on NAS (Step 2)
- Authenticate Google Calendar (Step 5)

**After that, everything is automatic!**

For detailed troubleshooting of specific issues, see:
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - OAuth authentication
- [CALENDAR_AUTH_SETUP.md](CALENDAR_AUTH_SETUP.md) - Calendar setup
- [DEPLOYMENT_UPDATED.md](DEPLOYMENT_UPDATED.md) - Environment variables
- [WEATHER_PANEL_FIXES.md](WEATHER_PANEL_FIXES.md) - Weather fixes
- [MEMORY_OPTIMIZATION.md](MEMORY_OPTIMIZATION.md) - Memory leaks
