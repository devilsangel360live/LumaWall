# LumaWall Deployment on NAS (OpenMediaVault/Synology)

This guide is for deploying LumaWall directly on your NAS using Docker.

## Prerequisites

- NAS with Docker support (OpenMediaVault 6, Synology DSM, etc.)
- Docker and Docker Compose installed on NAS
- SSH access to your NAS
- Photos stored locally on NAS at `/volume1/PhotosPool/Magic` (or your path)

## Quick Deployment

### 1. Connect to Your NAS

```bash
ssh your-username@omv6.local
# or
ssh your-username@192.168.1.203
```

### 2. Create Project Directory

```bash
# Create a directory for LumaWall (adjust path based on your NAS)
mkdir -p /srv/lumawall
cd /srv/lumawall
```

### 3. Copy Project Files

Transfer your LumaWall project to the NAS:

**Option A: Using SCP from your local machine**
```bash
# On your local machine
scp -r /Users/arindam.pal/Projects/LumaWall/* your-username@omv6.local:/srv/lumawall/
```

**Option B: Using Git (if available on NAS)**
```bash
# On the NAS
git clone <your-repo-url> /srv/lumawall
cd /srv/lumawall
```

**Option C: Using NAS web interface**
- Upload files via SMB/WebDAV to a shared folder
- Move to `/srv/lumawall`

### 4. Update Photo Path

Edit `docker-compose.yml` and verify the photos path:

```bash
nano docker-compose.yml
```

Find this line and update to match your NAS structure:
```yaml
volumes:
  - /volume1/PhotosPool/Magic:/app/photos:ro
```

Common NAS paths:
- **OpenMediaVault**: `/srv/dev-disk-by-uuid-xxx/PhotosPool/Magic`
- **Synology**: `/volume1/PhotosPool/Magic`
- **QNAP**: `/share/PhotosPool/Magic`

To find your actual path:
```bash
ls -la /srv/
# or
find / -name "PhotosPool" 2>/dev/null
```

### 5. Create Environment File

```bash
cat > .env << EOF
VITE_MAPTILER_API_KEY=likPSlRJ1hqJaNrNRo1L
EOF
```

### 6. Build and Run

```bash
# Build the Docker images
docker-compose build

# Start the containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7. Access LumaWall

Open your browser and navigate to:
```
http://omv6.local
# or
http://192.168.1.203
```

## Finding Your Photos Path on the NAS

If you're not sure where your photos are stored:

```bash
# Search for the PhotosPool directory
find /srv -name "PhotosPool" 2>/dev/null
find /volume1 -name "PhotosPool" 2>/dev/null

# Check where your SMB share is mounted
mount | grep PhotosPool

# List available volumes
ls -la /srv/
ls -la /volume1/
```

Once you find it, update the path in `docker-compose.yml`.

## OpenMediaVault Specific Notes

### If using OMV Docker plugin:

1. **Install Docker-Compose plugin** (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install docker-compose
   ```

2. **Check Docker service**:
   ```bash
   sudo systemctl status docker
   ```

3. **Typical OMV paths**:
   - Data: `/srv/dev-disk-by-uuid-{uuid}/`
   - Shares: `/srv/dev-disk-by-uuid-{uuid}/PhotosPool/Magic`

### Using OMV Web Interface (Alternative):

1. Go to **Services > Compose > Files**
2. Click **Add** and upload your `docker-compose.yml`
3. Start the stack from the web interface

## Port Configuration

By default, LumaWall uses:
- **Frontend**: Port 80
- **Backend**: Port 3001

If port 80 is already in use on your NAS (e.g., by OMV web UI on 8080), change it in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Access via http://omv6.local:8080
```

## Resource Usage

LumaWall is lightweight:
- **RAM**: ~150MB total
- **CPU**: Minimal (spikes during photo loading)
- **Disk**: ~500MB for Docker images

Safe for low-power NAS devices.

## Auto-Start on NAS Reboot

The `restart: unless-stopped` policy ensures containers restart automatically when the NAS reboots.

## Maintenance

### View Logs
```bash
cd /srv/lumawall
docker-compose logs -f
```

### Update LumaWall
```bash
cd /srv/lumawall
docker-compose down
git pull  # or re-copy files
docker-compose build
docker-compose up -d
```

### Stop LumaWall
```bash
cd /srv/lumawall
docker-compose down
```

### Restart Services
```bash
cd /srv/lumawall
docker-compose restart
```

## Troubleshooting

### Photos Not Loading

1. **Verify photo path exists**:
   ```bash
   ls -la /volume1/PhotosPool/Magic
   # or your actual path
   ```

2. **Check backend can access photos**:
   ```bash
   docker-compose exec backend ls -la /app/photos
   ```

3. **Check permissions**:
   ```bash
   # Backend needs read access
   chmod -R 755 /volume1/PhotosPool/Magic
   ```

### Port 80 Already in Use

```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Change LumaWall to use different port (edit docker-compose.yml)
# Then restart
docker-compose down
docker-compose up -d
```

### Container Won't Start

```bash
# Check Docker service
sudo systemctl status docker

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Out of Memory

If your NAS has limited RAM:
1. Stop other services temporarily
2. Build one service at a time:
   ```bash
   docker-compose build backend
   docker-compose build frontend
   docker-compose up -d
   ```

## Performance Tips for Low-Power NAS

1. **Reduce screen rotation speed** - Edit `App.jsx`, increase duration values
2. **Limit photo count** - Fewer photos = faster loading
3. **Reduce map refresh** - Edit `WeatherPanel.jsx`, increase 30-minute interval

## Backup

Important files to backup:
- `.env` - Environment variables
- `docker-compose.yml` - Configuration
- Source code (if modified)

Photos are already on the NAS storage.

## Security Notes

1. Photos mounted as **read-only** (`:ro`) - Docker can't modify your photos
2. Containers isolated in private network
3. No sensitive data stored in containers
4. API key in `.env` file (keep secure)

## Accessing from Other Devices

Once running, access LumaWall from:
- **Same network**: `http://omv6.local` or `http://192.168.1.203`
- **Specific device**: Open browser on your digital photo frame device and point to NAS IP

## Next Steps

After deployment:
1. Open LumaWall in browser
2. Verify photos are loading
3. Check weather panel displays correctly
4. Verify map tiles load
5. Test screen rotation through all panels

For a dedicated photo frame display:
- Set browser to full-screen mode (F11)
- Disable screen saver
- Configure browser to auto-start on boot
