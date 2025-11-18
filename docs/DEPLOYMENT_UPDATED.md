# Updated Deployment Guide - With Environment Variables

## Important Changes

The `.env` file is **gitignored** (for security), so you need to copy it manually to your NAS.

## How Environment Variables Work in Docker

### Local Development (backend/.env)
- Used when running `npm start` locally
- NOT used by Docker containers
- Gitignored (won't be in repo)

### Docker Deployment (root .env + docker-compose.yml)
- **Root `.env` file** (same directory as docker-compose.yml)
- Read by `docker-compose` command
- Variables passed to containers via `docker-compose.yml`
- **Must be copied to NAS manually**

## Step-by-Step Deployment

### 1. Create .env File on NAS

```bash
# SSH to NAS
ssh user@omv6.local

# Navigate to LumaWall directory
cd /home/LumaWall

# Create .env file
nano .env
```

**Paste this content:**
```env
# LumaWall Docker Environment Configuration

# ===== Frontend Configuration =====
VITE_MAPTILER_API_KEY=likPSlRJ1hqJaNrNRo1L

# ===== Backend Configuration =====
GOOGLE_CLIENT_ID=832081443901-tmiit069le5u68ahhcmtcbcakuqiceou.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://192.168.1.203:3001/api/calendar/auth/callback

# Calendar Sync Configuration (in minutes)
SYNC_INTERVAL=15
```

Save with **Ctrl+X**, then **Y**, then **Enter**.

### 2. Copy Updated Files

```bash
# From your local machine
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/data' \
  /Users/arindam.pal/Projects/LumaWall/ \
  user@omv6.local:/home/LumaWall/
```

**Note:** The `.env` file won't be copied by rsync (it's in .gitignore), which is why we created it manually in step 1.

### 3. Verify .env File on NAS

```bash
# SSH to NAS
ssh user@omv6.local

# Check .env exists
ls -la /home/LumaWall/.env

# View contents (verify your values)
cat /home/LumaWall/.env
```

### 4. Build and Start Containers

```bash
cd /home/LumaWall

# Stop old containers
docker-compose down

# Build with updated code
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 5. Verify Environment Variables Were Set

```bash
# Check backend environment
docker-compose exec backend printenv | grep SYNC_INTERVAL

# Expected output:
# SYNC_INTERVAL=15

# Check all Google vars
docker-compose exec backend printenv | grep GOOGLE
```

## Troubleshooting

### Problem: SYNC_INTERVAL not set in container

**Check:**
```bash
# On NAS, verify .env file exists
ls -la /home/LumaWall/.env

# Verify docker-compose sees it
docker-compose config | grep SYNC_INTERVAL
```

**Should show:**
```yaml
- SYNC_INTERVAL=15
```

**If not showing:**
1. .env file is missing → Create it (Step 1)
2. .env file in wrong location → Must be same directory as docker-compose.yml
3. Syntax error in .env → Check no quotes around values

### Problem: Calendar not syncing

**Check logs:**
```bash
docker-compose logs backend | grep sync
```

**Should see:**
```
Setting up calendar auto-sync: every 15 minutes
 Running scheduled calendar sync...
 Calendar sync complete: XX events synced
```

**If not showing:**
- Container wasn't rebuilt → Run `docker-compose build --no-cache backend`
- SYNC_INTERVAL not set → Check environment variables
- Google credentials missing → Check GOOGLE_CLIENT_ID/SECRET in container

### Problem: MapTiler map not loading

**Check:**
```bash
# Verify key in frontend
docker-compose exec frontend sh -c 'grep -o "likPSlRJ1h" /usr/share/nginx/html/assets/*.js | head -1'
```

**Should output:** `likPSlRJ1h` (first 10 chars of key)

**If empty:**
- Frontend wasn't rebuilt with .env present
- Rebuild: `docker-compose build --no-cache frontend`

## File Structure

```
/home/LumaWall/
├── .env                    ← CREATE THIS MANUALLY (gitignored)
├── docker-compose.yml      ← Reads .env file
├── backend/
│   ├── .env               ← Local dev only, NOT used by Docker
│   ├── Dockerfile
│   └── src/
└── frontend/
    ├── Dockerfile
    └── src/
```

## Environment Variable Hierarchy

1. **docker-compose.yml `environment:` section** (Highest priority)
   - Hardcoded values
   - Example: `NODE_ENV=production`

2. **Root .env file** (Variables with `${VAR_NAME}`)
   - Read by docker-compose
   - Example: `SYNC_INTERVAL=${SYNC_INTERVAL:-15}`
   - Default value after `:-`

3. **Backend .env file** (Local dev only)
   - NOT used by Docker containers
   - Only for `npm start` locally

## Changing Configuration

### Change Sync Interval

**Option 1: Edit .env on NAS**
```bash
# SSH to NAS
ssh user@omv6.local
cd /home/LumaWall
nano .env

# Change line:
SYNC_INTERVAL=5  # Every 5 minutes

# Restart backend
docker-compose restart backend
```

**Option 2: Override in docker-compose.yml**
```yaml
backend:
  environment:
    - SYNC_INTERVAL=5  # Hardcoded, ignores .env
```

### Update Google Credentials

```bash
# SSH to NAS
nano /home/LumaWall/.env

# Update values:
GOOGLE_CLIENT_ID=new_value
GOOGLE_CLIENT_SECRET=new_value

# Restart backend
docker-compose restart backend
```

## Security Notes

-  `.env` is gitignored (won't be committed to git)
-  Contains sensitive credentials (API keys, secrets)
-  Must be created manually on each deployment
-  Don't share .env file publicly
-  Keep backups somewhere safe

## Quick Deployment Script

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo " Deploying LumaWall to NAS..."

# Copy files
echo " Copying files..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/data' \
  --exclude '.env' \
  /Users/arindam.pal/Projects/LumaWall/ \
  user@omv6.local:/home/LumaWall/

echo "  IMPORTANT: Verify .env file exists on NAS!"
echo "   SSH to NAS and check: cat /home/LumaWall/.env"
echo ""
read -p "Press Enter when .env is verified, or Ctrl+C to abort..."

# Build on NAS
echo " Building containers..."
ssh user@omv6.local << 'ENDSSH'
  cd /home/LumaWall
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
  echo " Deployment complete!"
  echo " Checking logs..."
  docker-compose logs --tail=20
ENDSSH

echo " Done! Check logs with: ssh user@omv6.local 'cd /home/LumaWall && docker-compose logs -f'"
```

Make executable: `chmod +x deploy.sh`

Run: `./deploy.sh`

## Summary

**Key Points:**
1.  Create `.env` file manually on NAS (gitignored)
2.  Must be in same directory as docker-compose.yml
3.  Contains: MapTiler key, Google credentials, SYNC_INTERVAL
4.  docker-compose reads .env and passes to containers
5.  Rebuild containers after changing .env
6.  backend/.env is NOT used by Docker (local dev only)

**To change sync interval:**
- Edit `/home/LumaWall/.env` on NAS
- Change `SYNC_INTERVAL=15` to desired value
- Restart: `docker-compose restart backend`
