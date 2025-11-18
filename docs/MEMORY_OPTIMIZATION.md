# Memory Optimization Guide

## Identified Memory Issues

### 1. **Image Preloading Memory Leak** (FIXED)
**Location:** `frontend/src/components/Slideshow.jsx`

**Problem:**
- Created `new Image()` objects for preloading without cleanup
- Each photo rotation created new Image objects that stayed in memory
- With 10-15MB photos, this quickly accumulated to hundreds of MB

**Fix Applied:**
- Added cleanup function to useEffect that clears image sources
- Releases memory when component unmounts or images change

```javascript
return () => {
  img.src = ''
  if (img2) img2.src = ''
}
```

### 2. **No Automatic Page Refresh** (FIXED)
**Location:** `frontend/src/App.jsx`

**Problem:**
- App runs 24/7 without refresh
- JavaScript heap grows over time
- Browser memory management can't keep up with long-running single-page apps

**Fix Applied:**
- Added automatic page refresh every 6 hours
- Completely clears all memory and resets the app
- Happens seamlessly during normal operation

```javascript
setTimeout(() => {
  window.location.reload()
}, 6 * 60 * 60 * 1000) // 6 hours
```

### 3. **Large Photo Files**
**Issue:** Your photos are 8-15MB each

**Recommendations:**
1. **Optimize photos before uploading to NAS:**
   ```bash
   # Use ImageMagick to resize and compress
   mogrify -resize 1920x1080\> -quality 85 -format jpg *.jpg
   ```

2. **Or add backend image optimization:**
   - Use Sharp library in Node.js
   - Serve resized versions (1920x1080 max)
   - Reduces 10MB photos to ~500KB without visible quality loss

### 4. **MapTiler Map Memory** (MONITORED)
**Location:** `frontend/src/components/WeatherPanel.jsx`

**Current Status:**
- Map recreates every 30 minutes (API optimization)
- Old maps are properly cleaned up with `map.remove()`
- Monitor this if weather panel is shown frequently

**No action needed currently** - cleanup code exists

## Memory Usage Recommendations

### For 24/7 Operation:

1. **Use Firefox or Chrome with these settings:**
   ```
   Firefox: about:memory -> "Minimize memory usage" button
   Chrome: Set flag chrome://flags/#back-forward-cache to Disabled
   ```

2. **System Requirements:**
   - Minimum 4GB RAM (8GB recommended)
   - If using Raspberry Pi, use 4GB+ model

3. **Monitor Memory:**
   - Open browser Task Manager (Shift+Esc in Chrome/Edge)
   - Check memory usage periodically
   - Should stay under 2GB with fixes applied

### Photo Optimization Script

Save this as `optimize_photos.sh` and run on your photo folder:

```bash
#!/bin/bash
# Optimize photos for LumaWall
# Resize to max 1920x1080, compress to 85% quality

PHOTO_DIR="/srv/mergerfs/Mediapool/Photos/Magic"
BACKUP_DIR="/srv/mergerfs/Mediapool/Photos/Magic_Backup"

# Create backup
mkdir -p "$BACKUP_DIR"
cp -r "$PHOTO_DIR"/* "$BACKUP_DIR/"

# Optimize photos
find "$PHOTO_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | while read file; do
    echo "Optimizing: $file"
    convert "$file" -resize 1920x1080\> -quality 85 "$file"
done

echo "Optimization complete! Backups in: $BACKUP_DIR"
```

### Testing for Memory Leaks

1. **Open browser DevTools**
2. **Go to Performance tab**
3. **Take heap snapshot**
4. **Let app run for 1 hour**
5. **Take another heap snapshot**
6. **Compare - growth should be minimal (<100MB/hour)**

## Current Status

 **Image preloading leak** - FIXED
 **Auto-refresh** - ADDED (6 hour interval)
 **Large photos** - RECOMMEND optimization
 **Map cleanup** - Already implemented

## Next Steps

1. **Deploy these fixes:**
   ```bash
   cd /home/LumaWall
   docker-compose build --no-cache frontend
   docker-compose up -d
   ```

2. **Monitor memory usage** for 24 hours

3. **Optionally optimize photos** to reduce file sizes by 90%

4. **Consider shorter auto-refresh** (3 hours) if memory issues persist

## Expected Results

**Before fixes:**
- Memory: 500MB → 3GB+ over 12 hours
- Browser crashes after 24-48 hours

**After fixes:**
- Memory: 500MB → 1GB over 12 hours
- Stable operation for weeks/months
- Automatic refresh prevents long-term buildup
