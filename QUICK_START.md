# LumaWall - Quick Start Guide

Deploy LumaWall on your NAS in 5 minutes!

## 🚀 One-Command Deploy

```bash
# 1. SSH to your NAS
ssh user@omv6.local

# 2. Create directory and navigate
mkdir -p /srv/lumawall && cd /srv/lumawall

# 3. Copy your project files here (via SCP, Git, or file manager)

# 4. Create .env file
echo "VITE_MAPTILER_API_KEY=likPSlRJ1hqJaNrNRo1L" > .env

# 5. Update photo path in docker-compose.yml
# Find your photos: ls /srv/ or ls /volume1/
# Edit line 19: - /YOUR/PHOTO/PATH:/app/photos:ro

# 6. Deploy!
docker-compose up -d
```

## 📍 Access

Open browser: **http://omv6.local** or **http://192.168.1.203**

## ⚙️ Common Commands

```bash
cd /srv/lumawall

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update and restart
docker-compose down && docker-compose build && docker-compose up -d
```

## 🔧 Quick Fixes

**Photos not showing?**
```bash
# Check path exists
ls -la /volume1/PhotosPool/Magic

# Check backend sees them
docker-compose exec backend ls /app/photos
```

**Port 80 in use?**
```bash
# Edit docker-compose.yml, change:
ports:
  - "8080:80"  # Use port 8080 instead
```

**Need to find photo path?**
```bash
find /srv -name "PhotosPool" 2>/dev/null
find /volume1 -name "PhotosPool" 2>/dev/null
```

## 📁 Project Structure

```
LumaWall/
├── docker-compose.yml     # Main config - edit photo path here
├── .env                   # API keys
├── frontend/              # React app
│   ├── Dockerfile
│   └── nginx.conf
└── backend/               # Node.js server
    └── Dockerfile
```

## 🎯 What Gets Deployed

- **Frontend** (port 80): Photo frame UI with weather
- **Backend** (port 3001): Serves photos from NAS
- **Auto-restart**: Both services restart on NAS reboot

## 📖 Full Documentation

- [DEPLOYMENT_NAS.md](DEPLOYMENT_NAS.md) - Complete NAS deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Generic server deployment

That's it! Your LumaWall digital photo frame is now running! 🎉
