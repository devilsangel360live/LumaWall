# Quick Start: Google Calendar Authentication

## ChatGPT Was Right! 

Using **Desktop App OAuth** is indeed the best approach. Here's how to set it up:

## 5-Minute Setup

### 1. Create Desktop App OAuth Client

Go to: https://console.cloud.google.com/apis/credentials

- Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- Select: **Desktop app**
- Name: `LumaWall Desktop`
- Click **CREATE**
- Copy the **Client ID** and **Client Secret**

 **Important:** Must be "Desktop app", NOT "Web application"!

### 2. Update .env File

```bash
nano /Users/arindam.pal/Projects/LumaWall/.env
```

Update these lines with your new Desktop App credentials:
```env
GOOGLE_CLIENT_ID=your_desktop_app_client_id_here
GOOGLE_CLIENT_SECRET=your_desktop_app_client_secret_here
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
```

### 3. Run Authentication Script (On Your Laptop)

```bash
cd /Users/arindam.pal/Projects/LumaWall
node authenticate-google.js
```

Follow the prompts:
1. Open the authorization URL in your browser
2. Sign in to Google
3. Click "Allow"
4. Copy the authorization code
5. Paste it into the terminal

Script will save tokens to `backend/data/tokens.json`

### 4. Copy Tokens to NAS

```bash
scp backend/data/tokens.json user@omv6.local:/home/LumaWall/backend/data/
```

### 5. Update Backend Code on NAS

```bash
# Copy updated calendarService.js
scp backend/src/services/calendarService.js user@omv6.local:/home/LumaWall/backend/src/services/

# Copy updated .env
scp .env user@omv6.local:/home/LumaWall/.env
```

### 6. Restart Backend

```bash
ssh user@omv6.local "cd /home/LumaWall && docker-compose restart backend"
```

### 7. Verify It Works

```bash
ssh user@omv6.local "cd /home/LumaWall && docker-compose logs backend | tail -30"
```

You should see:
```
 Loaded OAuth tokens from file
Setting up calendar auto-sync: every 15 minutes
 Running scheduled calendar sync...
 Calendar sync complete: XX events synced
```

## That's It! 

No redirect URIs. No ngrok. No hassle.

The refresh token will keep working indefinitely!

---

## Troubleshooting

**"Missing Google OAuth credentials"**
- Make sure you updated .env with Desktop App credentials

**"redirect_uri_mismatch"**
- You're using Web Application OAuth client instead of Desktop App
- Create a new Desktop App client

**"No saved OAuth tokens found"**
- Make sure you copied tokens.json to NAS
- Check: `ssh user@omv6.local "cat /home/LumaWall/backend/data/tokens.json"`

**Need help?**
- See detailed guide: [GOOGLE_AUTH_DESKTOP_FLOW.md](GOOGLE_AUTH_DESKTOP_FLOW.md)
