# Calendar Sync Configuration

## Current Sync Behavior

### **Frontend Auto-Refresh** 
- **Fetches calendar data from backend every 5 minutes**
- Configured in: `frontend/src/hooks/useCalendarData.js:59-60`
- No action needed

### **Backend Auto-Sync**  (Now Enabled!)
- **Syncs with Google Calendar every 15 minutes**
- Configured in: `backend/src/index.js:39-59`
- Uses cron job: `*/15 * * * *`

## How It Works

```
Google Calendar
      ↓
      ↓ (Every 15 min - Backend cron)
      ↓
SQLite Database (on NAS)
      ↓
      ↓ (Every 5 min - Frontend poll)
      ↓
Display
```

### Timeline:

1. **You add event to Google Calendar**
2. **Wait up to 15 minutes** - Backend cron runs
3. **Backend syncs** - Fetches from Google, stores in SQLite
4. **Wait up to 5 minutes** - Frontend polls backend
5. **Event appears on display!**

**Maximum delay: 20 minutes (15 min backend + 5 min frontend)**

## Configuration Options

### Change Sync Interval

Edit `docker-compose.yml` or set environment variable:

```yaml
backend:
  environment:
    - SYNC_INTERVAL=10  # Sync every 10 minutes instead of 15
```

Or on NAS:
```bash
# In .env file
SYNC_INTERVAL=10
```

**Recommended intervals:**
- **5 minutes** - Frequent updates, more API calls
- **15 minutes** (default) - Good balance
- **30 minutes** - Less frequent, saves API quota

### Manual Sync

If you need immediate updates:

```bash
# Trigger sync via API
curl -X POST http://192.168.1.203:3001/api/calendar/sync
```

Or create a button in UI to call `syncCalendars()` function.

## Checking If Sync Is Working

### 1. Check Backend Logs

```bash
docker-compose logs -f backend
```

**Look for:**
```
Setting up calendar auto-sync: every 15 minutes
 Running scheduled calendar sync...
 Calendar sync complete: 42 events synced
```

**Happens every 15 minutes**

### 2. Add Test Event

1. Add event to Google Calendar NOW
2. Wait 15 minutes
3. Check backend logs for sync message
4. Wait 5 more minutes
5. Event should appear on display

### 3. Force Immediate Sync

```bash
# Restart backend to trigger immediate sync
docker-compose restart backend

# Or call sync API
curl -X POST http://localhost:3001/api/calendar/sync
```

## Troubleshooting

### Sync not happening?

**Check logs:**
```bash
docker-compose logs backend | grep sync
```

**Should show:**
```
Setting up calendar auto-sync: every 15 minutes
```

**If NOT showing**, cron job didn't start. Check:
- Backend container restarted after code changes
- No syntax errors in index.js

### Events not appearing?

**Check each layer:**

1. **Google Calendar** - Event actually created?
2. **Backend Sync** - Check logs for "Calendar sync complete"
3. **Database** - Check SQLite has data:
   ```bash
   docker-compose exec backend sqlite3 /app/data/calendar.db "SELECT COUNT(*) FROM events;"
   ```
4. **API Response** - Test endpoint:
   ```bash
   curl http://localhost:3001/api/calendar/events/today
   ```
5. **Frontend** - Check browser console for fetch errors

### Too many API calls?

Google Calendar API limits:
- **Free tier**: 1,000,000 requests/day
- **Per user**: 1,000 requests/100 seconds

**Our usage with 15-min sync:**
- 4 syncs/hour
- 96 syncs/day
- ~5-10 API calls per sync (depends on # of calendars)
- **Total: ~500-1000 API calls/day**  Well within limits

**To reduce:**
- Increase `SYNC_INTERVAL` to 30 or 60 minutes
- Only sync during waking hours (modify cron pattern)

### Sync during specific hours only

Edit `backend/src/index.js`:

```javascript
// Sync every 15 min, but only 6 AM - 11 PM
cron.schedule(`*/${syncInterval} 6-23 * * *`, async () => {
  // ... sync code
});
```

## Cron Schedule Examples

```javascript
// Every 15 minutes
'*/15 * * * *'

// Every 30 minutes
'*/30 * * * *'

// Every hour
'0 * * * *'

// Every 5 minutes, 6 AM - 11 PM
'*/5 6-23 * * *'

// Every 15 minutes, weekdays only
'*/15 * * * 1-5'

// At 8 AM and 6 PM every day
'0 8,18 * * *'
```

## Manual Sync Button (Optional)

Add to frontend for immediate sync:

```javascript
// In a component
import { useCalendarManagement } from './hooks/useCalendarData'

function SyncButton() {
  const { syncCalendars, loading } = useCalendarManagement()

  const handleSync = async () => {
    try {
      await syncCalendars()
      alert('Calendar synced!')
    } catch (error) {
      alert('Sync failed: ' + error.message)
    }
  }

  return (
    <button onClick={handleSync} disabled={loading}>
      {loading ? 'Syncing...' : 'Sync Now'}
    </button>
  )
}
```

## What Gets Synced

The backend syncs:
- **All events** from connected calendars
- **30 days back** to 30 days forward (configurable)
- **Event details**: title, time, location, description, color
- **Updates and deletions** from Google Calendar

## Database Storage

Events stored in SQLite at:
```
/app/data/calendar.db (inside container)
```

Persists across container restarts if volume mounted.

## Summary

 **Backend syncs with Google Calendar every 15 minutes**
 **Frontend fetches from backend every 5 minutes**
 **New events appear within 20 minutes maximum**
 **Can trigger manual sync anytime via API**
 **Well within Google API limits**

Deploy the updated backend to enable auto-sync!
