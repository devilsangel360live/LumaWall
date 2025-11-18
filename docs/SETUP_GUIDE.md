# LumaWall Setup Guide

Complete guide to get LumaWall up and running.

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Google account for calendar access

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your Google Calendar API credentials (see Google Calendar Setup below).

Start the backend:
```bash
npm run dev
```

Backend will be running at `http://localhost:3001`

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be running at `http://localhost:5173`

## Google Calendar API Setup

### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "LumaWall" and click "Create"

### Step 2: Enable Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: LumaWall
   - User support email: your email
   - Developer contact: your email
   - Add scope: `../auth/calendar.readonly`
   - Add test users: your email
4. Choose "Web application" as application type
5. Name: "LumaWall Backend"
6. Add Authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Backend

Update your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

### Step 5: Authenticate

1. Make sure backend is running
2. Get the auth URL:
```bash
curl http://localhost:3001/api/calendar/auth/url
```

3. Open the returned URL in your browser
4. Sign in and grant calendar access
5. You'll be redirected to a URL like:
   `http://localhost:3001/auth/google/callback?code=AUTHORIZATION_CODE`
6. Copy the `code` parameter value
7. Send it to the backend:
```bash
curl -X POST http://localhost:3001/api/calendar/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_CODE_HERE"}'
```

### Step 6: Sync Calendars

```bash
# Fetch calendar list
curl http://localhost:3001/api/calendar/list

# Trigger sync
curl -X POST http://localhost:3001/api/calendar/sync
```

### Step 7: View Your Calendar

Open `http://localhost:5173` in your browser to see your LumaWall display!

## Testing the Setup

Check if events are loading:

```bash
# Get today's events
curl http://localhost:3001/api/calendar/events/today

# Get timeline events
curl http://localhost:3001/api/calendar/events/timeline
```

## Deployment to Raspberry Pi

### Hardware Requirements

- Raspberry Pi 4 (4GB or 8GB recommended)
- MicroSD card (32GB+)
- Display (1080p or 4K)
- Power supply

### Software Setup

1. Install Raspberry Pi OS (64-bit recommended)
2. Update system:
```bash
sudo apt update && sudo apt upgrade -y
```

3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

4. Clone and setup LumaWall (follow Quick Start above)

5. Install Chromium:
```bash
sudo apt install -y chromium-browser unclutter
```

6. Build frontend:
```bash
cd frontend
npm run build
```

7. Serve frontend (option 1: simple HTTP server):
```bash
cd frontend/dist
npx serve -s . -p 5173
```

Or (option 2: use nginx - see below)

### Kiosk Mode Setup

Create autostart script at `~/.config/autostart/lumawall.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=LumaWall
Exec=/home/pi/lumawall-start.sh
```

Create `~/lumawall-start.sh`:

```bash
#!/bin/bash

# Start backend
cd /home/pi/LumaWall/backend
npm start &

# Wait for backend
sleep 5

# Start frontend server
cd /home/pi/LumaWall/frontend/dist
npx serve -s . -p 5173 &

# Wait for frontend
sleep 3

# Hide cursor
unclutter -idle 0 &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  http://localhost:5173
```

Make it executable:
```bash
chmod +x ~/lumawall-start.sh
```

### Production with nginx (Optional)

1. Install nginx:
```bash
sudo apt install -y nginx
```

2. Configure nginx at `/etc/nginx/sites-available/lumawall`:
```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        root /home/pi/LumaWall/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/lumawall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Process Management with PM2

1. Install PM2:
```bash
sudo npm install -g pm2
```

2. Start backend:
```bash
cd ~/LumaWall/backend
pm2 start src/index.js --name lumawall-backend
```

3. Save and auto-start:
```bash
pm2 save
pm2 startup
```

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 20.x+)
- Check logs: `pm2 logs lumawall-backend`
- Verify `.env` file exists and has correct credentials

### Calendar not syncing
- Check backend health: `curl http://localhost:3001/health`
- Verify OAuth tokens are valid
- Re-run authentication steps
- Check sync logs in database

### Frontend shows errors
- Verify backend is running
- Check console in browser DevTools
- Verify API proxy is working: `curl http://localhost:5173/api/calendar/events/today`

### Display issues
- Adjust screen resolution in Tailwind config
- Test different browsers
- Check for console errors

## Next Steps

- Configure multiple calendars
- Set up automatic sync schedule
- Customize color themes
- Add weather widget (Phase 2)
- Add photo slideshow (Phase 3)

## Support

For issues, check:
- Backend logs: `pm2 logs lumawall-backend`
- Browser console (F12)
- Database: `sqlite3 backend/src/db/cache.db`
