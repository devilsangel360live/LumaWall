# LumaWall Docker Deployment Guide

This guide will help you deploy LumaWall to your server using Docker.

## Prerequisites

- Docker Engine (20.10+)
- Docker Compose (1.29+)
- Server with at least 2GB RAM
- Access to your NAS (smb://omv6/PhotosPool/Magic)

## Quick Start

### 1. Mount Your NAS on the Server

First, mount your NAS drive on the server:

```bash
# Create mount point
sudo mkdir -p /mnt/nasphotos

# Mount the NAS (replace with your credentials if needed)
sudo mount -t cifs //omv6.local/PhotosPool/Magic /mnt/nasphotos -o guest,ro,vers=3.0

# Or add to /etc/fstab for auto-mount on boot:
echo "//omv6.local/PhotosPool/Magic /mnt/nasphotos cifs guest,ro,vers=3.0,_netdev 0 0" | sudo tee -a /etc/fstab
```

### 2. Create Environment File

Create a `.env` file in the project root:

```bash
cd /path/to/LumaWall
cat > .env << EOF
# MapTiler API Key
VITE_MAPTILER_API_KEY=likPSlRJ1hqJaNrNRo1L

# NAS Photos Path (on the server)
NAS_PHOTOS_PATH=/mnt/nasphotos
EOF
```

### 3. Update docker-compose.yml

Edit `docker-compose.yml` and update the NAS volume path:

```yaml
volumes:
  - /mnt/nasphotos:/app/photos:ro
```

### 4. Build and Run

```bash
# Build the images
docker-compose build

# Start the containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access LumaWall

Open your browser and navigate to:
```
http://your-server-ip
```

## Production Deployment

### Using a Reverse Proxy (Recommended)

For production, use nginx or Traefik as a reverse proxy with SSL:

#### Example with Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name lumawall.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lumawall.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Auto-restart on Server Reboot

The `restart: unless-stopped` policy in docker-compose.yml ensures containers restart automatically.

## Maintenance

### Update the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Stop the Application

```bash
# Stop containers (but keep them)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v
```

### Health Checks

Both services have health checks configured:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' lumawall-frontend
docker inspect --format='{{.State.Health.Status}}' lumawall-backend
```

## Troubleshooting

### Photos Not Loading

1. Check NAS is mounted:
```bash
ls -la /mnt/nasphotos
```

2. Check backend can access photos:
```bash
docker-compose exec backend ls -la /app/photos
```

3. Check backend logs:
```bash
docker-compose logs backend | grep -i photo
```

### Container Won't Start

```bash
# Check logs
docker-compose logs frontend
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### MapTiler Not Working

1. Verify API key in `.env` file
2. Check browser console for errors
3. Ensure environment variable is passed to frontend container

## Resource Usage

Typical resource usage:
- **Frontend**: ~50MB RAM
- **Backend**: ~100MB RAM
- **Total**: ~150MB RAM + disk space for images

## Security Notes

1. **NAS Mount**: Mounted as read-only (`:ro`)
2. **API Keys**: Stored in `.env` file (not committed to git)
3. **Network**: Containers isolated in `lumawall-network`
4. **Nginx**: Security headers configured

## Advanced Configuration

### Custom Port

Edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change 80 to your desired port
```

### Custom Photo Path

Update the volume mount in `docker-compose.yml`:

```yaml
volumes:
  - /your/custom/path:/app/photos:ro
```

### Performance Tuning

For better performance on Raspberry Pi or low-power devices:

1. Reduce MapTiler map refresh rate (in WeatherPanel.jsx)
2. Limit photo cache size
3. Reduce screen rotation intervals

## Backup

Important files to backup:
- `.env` - Environment variables
- `docker-compose.yml` - Container configuration
- Photos are on NAS (already backed up)

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Check container status: `docker-compose ps`
3. Verify NAS mount: `ls /mnt/nasphotos`
4. Check network: `docker network inspect lumawall_lumawall-network`
