# Fix LumaWall "News Unavailable" Issue on NAS

## Problem
The frontend container has `http://localhost:3001` hardcoded in the built JavaScript files, but it should use relative paths like `/api/news/articles` so nginx can proxy them.

## Solution
SSH into your NAS and run these commands:

```bash
# Step 1: SSH into your NAS
ssh root@omv6.local

# Step 2: Navigate to LumaWall directory
cd /home/LumaWall

# Step 3: Verify current .env files
echo "=== Checking root .env ==="
grep VITE_API_URL .env || echo "VITE_API_URL not found"

echo "=== Checking frontend/.env ==="
grep VITE_API_URL frontend/.env || echo "VITE_API_URL not found"

# Step 4: Fix .env files if needed
# Make sure VITE_API_URL is empty (not set to localhost:3001)
echo "VITE_API_URL=" >> .env

# Also fix frontend/.env
echo "VITE_API_URL=" >> frontend/.env

# Step 5: Stop all containers
docker-compose down

# Step 6: Remove old frontend image to force rebuild
docker rmi $(docker images | grep lumawall-frontend | awk '{print $3}')

# Step 7: Rebuild frontend with NO CACHE (this is critical!)
docker-compose build --no-cache frontend

# Step 8: Also rebuild backend to get CORS fix
docker-compose build backend

# Step 9: Start containers
docker-compose up -d

# Step 10: Wait a few seconds
sleep 10

# Step 11: Verify the fix
echo "=== Checking if localhost:3001 is in the built files ==="
docker-compose exec frontend sh -c 'cat /usr/share/nginx/html/assets/*.js | grep -c "localhost:3001" || echo 0'

# If the above returns 0, the fix worked!
# If it returns a number > 0, the build still has localhost:3001

# Step 12: Check container status
docker-compose ps

# Step 13: Test backend
docker-compose exec backend wget -q -O- http://localhost:3001/api/health

echo "=== Done! ==="
echo "Now try accessing http://192.168.1.203 in your browser"
```

## What This Does:

1. **Sets `VITE_API_URL=` to empty** in both .env files
2. **Removes the old frontend image** so Docker can't use cached layers
3. **Rebuilds with `--no-cache`** ensuring Vite uses the empty `VITE_API_URL`
4. **When `VITE_API_URL` is empty**, the frontend code uses relative paths like `/api/news/articles`
5. **Nginx proxies** these requests to `http://backend:3001/api/news/articles`

## Expected Result:

After running these commands:
- Browser will request `/api/news/articles` (relative URL)
- Nginx will proxy to backend container
- News and NASA photo will load correctly
- No more "News Unavailable" error

## If It Still Doesn't Work:

Check the browser Network tab again. If you still see `localhost:3001`, then:

1. The .env file wasn't updated before the build
2. OR Docker used a cached layer despite `--no-cache`

Try this nuclear option:

```bash
# Remove EVERYTHING and start fresh
docker-compose down
docker system prune -af --volumes
docker-compose build --no-cache
docker-compose up -d
```

⚠️ **WARNING**: This will delete ALL unused Docker images and volumes on your system!
