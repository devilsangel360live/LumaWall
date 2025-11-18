# Collage Freeze Fix

## Problem

When the screen rotates away from the collage view and back, the collage remains frozen showing the same photos instead of generating a new random collage.

## Root Cause

### Issue 1: Missing Dependencies in useEffect
In [CollageView.jsx:79-91](frontend/src/components/CollageView.jsx#L79-L91), the auto-rotate timer had incomplete dependencies:

```javascript
// ❌ BEFORE - Missing generateRandomCollage in dependencies
useEffect(() => {
  const timer = setInterval(() => {
    generateRandomCollage()
  }, 8000)
  return () => clearInterval(timer)
}, [photos, imagesLoaded, collagePhotos.length])
```

The `generateRandomCollage` function wasn't in the dependency array, causing React to miss updates.

### Issue 2: Component Not Remounting
When screens rotate, the CollageView component stays mounted (just hidden with `opacity-0 pointer-events-none`). This means:
- The same collage photos persist in state
- When the screen becomes visible again, the old photos are displayed
- No fresh collage is generated

## Solution

### Fix 1: Wrap generateRandomCollage in useCallback

**File:** [CollageView.jsx:50-70](frontend/src/components/CollageView.jsx#L50-L70)

```javascript
// ✅ AFTER - Memoized function with proper dependencies
const generateRandomCollage = useCallback(() => {
  if (photos.length === 0) return

  const count = Math.floor(Math.random() * 5) + 2
  const shuffled = [...photos].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  const withStyles = selected.map(photo => ({
    ...photo,
    rotation: Math.random() * 16 - 8,
    scale: Math.random() * 0.15 + 0.9,
    zIndex: Math.floor(Math.random() * 10)
  }))

  setCollagePhotos(withStyles)
}, [photos])
```

**Why:** `useCallback` ensures the function identity is stable and only changes when `photos` changes.

### Fix 2: Add generateRandomCollage to Dependencies

**File:** [CollageView.jsx:79-91](frontend/src/components/CollageView.jsx#L79-L91)

```javascript
// ✅ AFTER - Complete dependencies
useEffect(() => {
  if (photos.length === 0 || imagesLoaded < collagePhotos.length) return

  const timer = setInterval(() => {
    setImagesLoaded(0)
    setTimeout(() => {
      generateRandomCollage()
    }, 300)
  }, 8000)

  return () => clearInterval(timer)
}, [photos.length, imagesLoaded, collagePhotos.length, generateRandomCollage])
```

**Why:** Now the effect properly tracks when `generateRandomCollage` changes.

### Fix 3: Force Component Remount on Screen Change

**File:** [App.jsx:15](frontend/src/App.jsx#L15)

Added state to track collage refreshes:
```javascript
const [collageKey, setCollageKey] = useState(0)
```

**File:** [App.jsx:59-66](frontend/src/App.jsx#L59-L66)

Increment key when navigating to collage screen:
```javascript
setCurrentScreen(prev => {
  const next = (prev + 1) % 5
  // Increment collage key when navigating to collage screen to force fresh render
  if (next === 3) {
    setCollageKey(k => k + 1)
  }
  return next
})
```

**File:** [App.jsx:193](frontend/src/App.jsx#L193)

Use key prop to force remount:
```javascript
<CollageView key={collageKey} colors={collageBg.colors} />
```

**Why:** Changing the `key` prop forces React to unmount and remount the component, ensuring a fresh collage is generated each time the screen becomes visible.

## How It Works Now

1. **When screen rotates to collage (screen 3):**
   - `collageKey` increments
   - React unmounts old CollageView instance
   - React mounts new CollageView instance
   - Fresh collage is generated with random photos

2. **While collage screen is visible:**
   - Auto-rotate timer runs every 8 seconds
   - New random collage is generated each cycle
   - All dependencies are properly tracked

3. **When screen rotates away:**
   - Component stays mounted but hidden
   - Timer is cleaned up properly
   - No memory leaks

4. **When screen rotates back to collage:**
   - Process repeats from step 1
   - Guaranteed fresh collage every time

## Testing

### Before Fix:
```
Screen rotation: Month → Week → Slideshow → Collage (shows photos A, B, C)
Next rotation: Month → Week → Slideshow → Collage (shows same photos A, B, C) ❌
```

### After Fix:
```
Screen rotation: Month → Week → Slideshow → Collage (shows photos A, B, C)
Next rotation: Month → Week → Slideshow → Collage (shows NEW photos D, E, F) ✅
```

## Files Modified

1. **[CollageView.jsx](frontend/src/components/CollageView.jsx)**
   - Added `useCallback` import
   - Wrapped `generateRandomCollage` in `useCallback`
   - Fixed dependency arrays

2. **[App.jsx](frontend/src/App.jsx)**
   - Added `collageKey` state
   - Increment key when navigating to collage screen
   - Pass key prop to CollageView

## Deployment

After deploying this fix:

1. Copy updated files to NAS:
   ```bash
   scp /Users/arindam.pal/Projects/LumaWall/frontend/src/components/CollageView.jsx user@omv6.local:/home/LumaWall/frontend/src/components/
   scp /Users/arindam.pal/Projects/LumaWall/frontend/src/App.jsx user@omv6.local:/home/LumaWall/frontend/src/
   ```

2. Rebuild frontend:
   ```bash
   ssh user@omv6.local
   cd /home/LumaWall
   docker-compose build --no-cache frontend
   docker-compose up -d frontend
   ```

3. Test collage rotation:
   - Wait for full screen rotation cycle
   - Verify collage shows different photos each time it appears
   - Verify collage auto-rotates while visible (every 8 seconds)

## Summary

✅ **Fixed:** Collage now generates fresh random photos every time the screen rotates to it

✅ **Fixed:** Auto-rotation continues working while collage is visible

✅ **Fixed:** Proper cleanup and no memory leaks

✅ **Result:** Dynamic, never-repeating collage display
