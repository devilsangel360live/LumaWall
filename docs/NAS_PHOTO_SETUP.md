# NAS Photo Slideshow Setup Guide

This guide explains how to set up the photo slideshow feature that displays images from your NAS drive.

## Prerequisites

- A Samba/SMB share accessible on your network
- Guest read-only access enabled on the share (or credentials if required)
- Photos stored on the NAS in common formats (JPG, PNG, GIF, WebP, HEIC)

## Step 1: Create Mount Point

Create a directory where the NAS share will be mounted:

```bash
mkdir -p ~/mnt/nasphotos
```

## Step 2: Mount the NAS Share

### macOS

For your specific NAS setup (smb://omv6/PhotosPool/Magic):

```bash
# Mount with guest access
mount -t smbfs //guest@omv6/PhotosPool/Magic ~/mnt/nasphotos
```

If you need to unmount:
```bash
umount ~/mnt/nasphotos
```

### Auto-mount on Login (macOS)

To automatically mount the share when you log in:

1. Open **System Settings** > **Users & Groups**
2. Select your user and click **Login Items**
3. Click the **+** button and add a script that runs:
   ```bash
   mount -t smbfs //guest@omv6/PhotosPool/Magic /Users/yourusername/mnt/nasphotos
   ```

Alternatively, create a LaunchAgent plist file:

```bash
# Create the plist file
cat > ~/Library/LaunchAgents/com.lumawall.mountnas.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.lumawall.mountnas</string>
    <key>ProgramArguments</key>
    <array>
        <string>/sbin/mount</string>
        <string>-t</string>
        <string>smbfs</string>
        <string>//guest@omv6/PhotosPool/Magic</string>
        <string>/Users/yourusername/mnt/nasphotos</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

# Replace 'yourusername' with your actual username
sed -i '' 's/yourusername/'"$USER"'/g' ~/Library/LaunchAgents/com.lumawall.mountnas.plist

# Load the agent
launchctl load ~/Library/LaunchAgents/com.lumawall.mountnas.plist
```

### Linux

```bash
# Install cifs-utils if not already installed
sudo apt-get install cifs-utils

# Mount with guest access
sudo mount -t cifs //omv6/PhotosPool/Magic ~/mnt/nasphotos -o guest,ro

# For auto-mount, add to /etc/fstab:
# //omv6/PhotosPool/Magic /home/yourusername/mnt/nasphotos cifs guest,ro,uid=1000,gid=1000 0 0
```

## Step 3: Configure Backend

The backend is already configured to read photos from `~/mnt/nasphotos`. You can change this path in the `.env` file:

```bash
cd backend
nano .env
```

Update the path if needed:
```
PHOTOS_MOUNT_PATH=/Users/yourusername/mnt/nasphotos
```

## Step 4: Verify Setup

1. **Check if the mount is accessible:**
   ```bash
   ls ~/mnt/nasphotos
   ```
   You should see your photos directory structure.

2. **Test the backend API:**
   ```bash
   # Make sure backend is running
   cd backend
   npm start

   # In another terminal, test the API
   curl http://localhost:3001/api/photos/stats
   ```

   You should see a response with photo statistics:
   ```json
   {
     "accessible": true,
     "path": "/Users/yourusername/mnt/nasphotos",
     "totalPhotos": 1234
   }
   ```

3. **View the slideshow:**
   - Start the frontend: `cd frontend && npm run dev`
   - Open http://localhost:5173
   - Wait for the screen rotation to reach the slideshow (3rd screen)

## Troubleshooting

### Mount point not accessible

**Error:** "Photos directory not accessible"

**Solution:**
- Verify the NAS is online and reachable: `ping omv6`
- Check the mount: `mount | grep nasphotos`
- Try mounting manually with the command above
- Check permissions: `ls -la ~/mnt/nasphotos`

### No photos found

**Error:** "No photos found in the collection"

**Solution:**
- Verify photos exist in the mounted directory
- Check that photo files have supported extensions (.jpg, .jpeg, .png, .gif, .webp, .heic, .heif)
- Check backend logs for errors

### Backend can't access photos

**Error:** Backend returns 503 or "Photos directory not accessible"

**Solution:**
- Verify `PHOTOS_MOUNT_PATH` in backend `.env` is correct
- Ensure the backend user has read permissions
- Restart the backend: `cd backend && npm start`

### Photos not loading in slideshow

**Solution:**
- Check browser console for errors (F12)
- Verify backend is running: `curl http://localhost:3001/health`
- Test photo endpoint: `curl http://localhost:3001/api/photos/list?count=10`
- Check CORS settings in backend

## Configuration Options

### Slideshow Settings

Edit `frontend/src/components/Slideshow.jsx` to customize:

- **Photo count:** Change the `count` parameter in the API call (default: 100)
- **Display duration:** Change the interval in the `setInterval` (default: 8000ms = 8 seconds)
- **Transition speed:** Adjust the `duration-500` class (default: 500ms fade)

### Supported Photo Formats

The backend supports these file extensions:
- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.heic`, `.heif`

To add more formats, edit `backend/src/services/photoService.js` and add to the `supportedFormats` array.

## Screen Rotation

The slideshow is screen #3 in the rotation:
1. Screen 1: Monthly Calendar View (10 seconds)
2. Screen 2: Weekly Timeline View (10 seconds)
3. Screen 3: Photo Slideshow (10 seconds)

To change rotation timing, edit `frontend/src/App.jsx` and modify the `setInterval` duration.

## Network Considerations

- The NAS must be accessible on your local network
- If using WiFi, ensure strong connection for smooth photo loading
- Large photos (>5MB) may take time to load; consider resizing photos on the NAS for better performance
- The backend caches nothing; all photos are served on-demand from the NAS
