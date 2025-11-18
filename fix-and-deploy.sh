#!/bin/bash
# Fix LumaWall frontend API URL and deploy to NAS

set -e

echo "========================================"
echo "LumaWall Fix & Deploy Script"
echo "========================================"
echo ""

# Check if NAS details provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 NAS_USER@NAS_HOST /path/on/nas"
    echo "Example: $0 root@omv6.local /home/LumaWall"
    exit 1
fi

NAS_SSH="$1"
NAS_PATH="$2"

echo "Step 1: Verifying local .env configuration..."
echo "-----"

# Check if VITE_API_URL is set correctly
if grep -q "^VITE_API_URL=$" .env 2>/dev/null; then
    echo "✅ Root .env: VITE_API_URL is empty (correct)"
else
    echo "⚠️  Setting VITE_API_URL to empty in root .env"
    if grep -q "^VITE_API_URL=" .env 2>/dev/null; then
        sed -i.bak 's/^VITE_API_URL=.*/VITE_API_URL=/' .env
    else
        echo "VITE_API_URL=" >> .env
    fi
fi

if grep -q "^VITE_API_URL=$" frontend/.env 2>/dev/null; then
    echo "✅ Frontend .env: VITE_API_URL is empty (correct)"
else
    echo "⚠️  Setting VITE_API_URL to empty in frontend/.env"
    if grep -q "^VITE_API_URL=" frontend/.env 2>/dev/null; then
        sed -i.bak 's/^VITE_API_URL=.*/VITE_API_URL=/' frontend/.env
    else
        echo "VITE_API_URL=" >> frontend/.env
    fi
fi

echo ""
echo "Step 2: Syncing files to NAS..."
echo "-----"

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/data/*.db' \
  --exclude 'frontend/dist' \
  --exclude '*.bak' \
  .env \
  docker-compose.yml \
  backend/ \
  frontend/ \
  ${NAS_SSH}:${NAS_PATH}/

echo ""
echo "Step 3: Stopping containers on NAS..."
echo "-----"

ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose down"

echo ""
echo "Step 4: Removing old images to force rebuild..."
echo "-----"

ssh ${NAS_SSH} "cd ${NAS_PATH} && \
  docker-compose rm -f frontend backend || true && \
  docker rmi lumawall-frontend lumawall-backend 2>/dev/null || true"

echo ""
echo "Step 5: Rebuilding containers (this may take a few minutes)..."
echo "-----"

ssh ${NAS_SSH} "cd ${NAS_PATH} && \
  echo 'Building frontend...' && \
  docker-compose build --no-cache frontend && \
  echo 'Building backend...' && \
  docker-compose build backend"

echo ""
echo "Step 6: Starting containers..."
echo "-----"

ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose up -d"

echo ""
echo "Step 7: Waiting for containers to be ready..."
sleep 10

echo ""
echo "Step 8: Verifying deployment..."
echo "-----"

echo "Container status:"
ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose ps"

echo ""
echo "Testing backend health:"
ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose exec -T backend wget -q -O- http://localhost:3001/api/health" && echo "✅ Backend is responding" || echo "❌ Backend health check failed"

echo ""
echo "Checking frontend build for localhost:3001:"
ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose exec -T frontend sh -c 'cat /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -c \"localhost:3001\" || echo 0'" | while read count; do
  if [ "$count" = "0" ]; then
    echo "✅ No localhost:3001 found in frontend build!"
  else
    echo "❌ WARNING: Found $count instances of localhost:3001 in frontend build"
  fi
done

echo ""
echo "Checking for relative /api paths:"
ssh ${NAS_SSH} "cd ${NAS_PATH} && docker-compose exec -T frontend sh -c 'cat /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -o \"\\\"/api/news\" | head -1'" && echo "✅ Frontend is using relative API paths" || echo "⚠️  Could not verify relative API paths"

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "Your LumaWall should now be accessible and working!"
echo ""
echo "To view logs:"
echo "  ssh ${NAS_SSH} 'cd ${NAS_PATH} && docker-compose logs -f'"
echo ""
echo "To restart:"
echo "  ssh ${NAS_SSH} 'cd ${NAS_PATH} && docker-compose restart'"
echo ""
