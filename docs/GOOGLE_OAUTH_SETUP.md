# Google OAuth Setup for Private IP Address

## The Problem

Google OAuth doesn't work well with private IP addresses (like `192.168.1.203`) by default. You'll get this error:

```
device_id and device_name are required for private IP: http://192.168.1.203:3001/api/calendar/auth/callback
```

## Solutions

### **Option 1: Use Localhost (Recommended for Testing)**

Instead of accessing via `192.168.1.203`, use `localhost` from the NAS itself.

**Steps:**
1. SSH into your NAS
2. Run authentication from there:
   ```bash
   curl http://localhost:3001/api/calendar/auth/url
   ```
3. Copy the auth URL and open it in a browser
4. After auth, it redirects to localhost:3001 (which works on NAS)

**Pros:** Simple, works immediately
**Cons:** Must SSH to NAS for initial auth

---

### **Option 2: Configure Google Cloud Console for Private IP**

Update your Google Cloud OAuth consent screen to allow private IPs.

#### Step 1: Update Redirect URI in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click to edit
4. Under **Authorized redirect URIs**, add:
   ```
   http://192.168.1.203:3001/api/calendar/auth/callback
   ```
5. Click **Save**

#### Step 2: Update Your .env File

Make sure `GOOGLE_REDIRECT_URI` matches:
```env
GOOGLE_REDIRECT_URI=http://192.168.1.203:3001/api/calendar/auth/callback
```

#### Step 3: Verify OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Check **User type**: Should be "External" (for personal use) or "Internal" (for workspace)
3. Under **Authorized domains**: Leave empty or add your domain if you have one
4. Click **Save and Continue**

**Note:** Google may show warnings about using HTTP (not HTTPS) with private IPs. This is expected for local development.

---

### **Option 3: Use Hostname Instead of IP**

If your NAS has a hostname (like `omv6.local`), use that instead.

**Update .env:**
```env
GOOGLE_REDIRECT_URI=http://omv6.local:3001/api/calendar/auth/callback
```

**Add to Google Cloud Console:**
```
http://omv6.local:3001/api/calendar/auth/callback
```

**Pros:** More stable than IP (survives DHCP changes)
**Cons:** Requires mDNS/Bonjour to work

---

### **Option 4: Use ngrok (Advanced)**

Create a public HTTPS URL that tunnels to your NAS.

#### Step 1: Install ngrok on NAS
```bash
# On NAS
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

#### Step 2: Create Tunnel
```bash
ngrok http 3001
```

You'll get a URL like: `https://abc123.ngrok.io`

#### Step 3: Update Configuration

**In Google Cloud Console:**
```
https://abc123.ngrok.io/api/calendar/auth/callback
```

**In .env:**
```env
GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/calendar/auth/callback
```

**Pros:** Works from any device, uses HTTPS
**Cons:** URL changes each time, requires ngrok account for permanent URLs

---

## Recommended Setup for Home Use

### For Initial Authentication:

**Use localhost from NAS:**
1. SSH to NAS
2. Get auth URL: `curl http://localhost:3001/api/calendar/auth/url`
3. Open URL in browser (can be any device)
4. Authorize
5. You'll see "Successfully authenticated!"

### For Ongoing Use:

Once authenticated, tokens are saved. No need to re-authenticate!

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in your request doesn't match Google Cloud Console

**Fix:**
1. Check `.env` file: `cat /home/LumaWall/.env | grep REDIRECT_URI`
2. Check Google Cloud Console: https://console.cloud.google.com/apis/credentials
3. Make sure they match EXACTLY (including http/https, port, path)

### Error: "device_id and device_name are required"

**Cause:** Using private IP without proper configuration

**Fix:** Use one of the solutions above (localhost, hostname, or ngrok)

### Error: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Fill out required fields (App name, User support email, Developer contact)
3. Save and continue through all steps
4. Add your Google account as a test user

### Can't Access from Browser

**Problem:** Opening `http://192.168.1.203:3001/...` doesn't work

**Check:**
1. Is backend running? `docker-compose ps`
2. Port 3001 exposed? Check `docker-compose.yml` ports section
3. Firewall blocking? Check NAS firewall settings
4. Try from NAS itself: `curl http://localhost:3001/api/calendar/auth/url`

---

## Security Considerations

### HTTP vs HTTPS

**For home use on private network:**
- ✅ HTTP is acceptable
- ✅ Traffic stays within your local network
- ✅ Google allows it for localhost/private IPs

**For public/production use:**
- ❌ HTTP is not secure
- ✅ Must use HTTPS with valid certificate
- ✅ Use Let's Encrypt or similar

### OAuth Scopes

Currently requests:
```
https://www.googleapis.com/auth/calendar.readonly
```

**This allows:**
- ✅ Read calendar events
- ❌ Cannot modify events
- ❌ Cannot delete events
- ❌ Cannot access other Google services

---

## Complete Setup Example

### 1. Update docker-compose.yml .env File

```bash
# On NAS
cd /home/LumaWall
nano .env
```

**Add/Update:**
```env
GOOGLE_CLIENT_ID=832081443901-tmiit069le5u68ahhcmtcbcakuqiceou.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/auth/callback
```

### 2. Restart Backend

```bash
docker-compose restart backend
```

### 3. Authenticate

**From NAS:**
```bash
curl http://localhost:3001/api/calendar/auth/url
```

**Copy the authUrl and open in browser (from any device)**

### 4. Verify

```bash
# Check tokens saved
docker-compose exec backend cat /app/data/tokens.json

# Check logs
docker-compose logs backend | grep "Loaded OAuth tokens"
```

Should see: `✅ Loaded OAuth tokens from file`

### 5. Test Sync

```bash
curl -X POST http://192.168.1.203:3001/api/calendar/sync
```

Should see successful sync in logs!

---

## Summary

**For home use, the easiest approach:**

1. ✅ Use `http://localhost:3001` for redirect URI
2. ✅ Authenticate from NAS (via SSH + curl)
3. ✅ Once authenticated, tokens persist forever
4. ✅ Access display from any device at `http://192.168.1.203`

**Key Point:** You only need localhost for the initial OAuth callback. After that, everything works from any device on your network!
