# Google Calendar API - Limits & Costs

## Google Calendar API is 100% FREE! 

**Important:** Google Calendar API has **NO COST** - it's completely free for personal and commercial use!

## API Quota Limits

### Free Tier (Default)
- **Requests per day:** 1,000,000 (1 million!)
- **Requests per 100 seconds per user:** 1,000
- **Requests per 100 seconds:** 10,000

Source: https://developers.google.com/calendar/api/guides/quota

### What This Means:
-  You will NEVER hit these limits with LumaWall
-  No billing account needed
-  No credit card required
-  100% free forever

## LumaWall API Usage Calculation

### Current Configuration (15-minute sync)

**API calls per sync:**
1. List calendars: **1 call**
2. Fetch events per calendar: **1 call × number of calendars**
   - 1 calendar = 1 call
   - 3 calendars = 3 calls
   - 5 calendars = 5 calls

**Example with 3 calendars:**
- Calls per sync: 1 + 3 = **4 calls**
- Syncs per hour: 60 ÷ 15 = **4 syncs**
- Calls per hour: 4 × 4 = **16 calls**
- Calls per day: 16 × 24 = **384 calls**
- **Daily usage: 384 / 1,000,000 = 0.0384%** 

### Different Sync Frequencies

| Sync Interval | Syncs/Day | API Calls/Day (3 calendars) | % of Quota |
|---------------|-----------|------------------------------|------------|
| **1 minute** | 1,440 | 5,760 | 0.58% |
| **5 minutes** | 288 | 1,152 | 0.12% |
| **10 minutes** | 144 | 576 | 0.06% |
| **15 minutes**  | 96 | 384 | 0.04% |
| **30 minutes** | 48 | 192 | 0.02% |
| **60 minutes** | 24 | 96 | 0.01% |

 = Recommended default

### With More Calendars

| # Calendars | Calls/Sync | Daily Calls (15 min) | % of Quota |
|-------------|------------|----------------------|------------|
| 1 | 2 | 192 | 0.02% |
| 3 | 4 | 384 | 0.04% |
| 5 | 6 | 576 | 0.06% |
| 10 | 11 | 1,056 | 0.11% |
| 20 | 21 | 2,016 | 0.20% |

**Even with 20 calendars syncing every minute, you'd only use 14% of daily quota!**

## Recommendations

### For Different Use Cases:

#### **Personal Home Display** (1-5 calendars)
```yaml
SYNC_INTERVAL=15  # Every 15 minutes
```
- **Daily API calls:** ~200-600
- **Quota usage:** <0.1%
- **Delay:** Max 20 minutes for new events
- **Perfect balance** 

#### **Family/Multi-User** (5-10 calendars)
```yaml
SYNC_INTERVAL=10  # Every 10 minutes
```
- **Daily API calls:** ~600-1,500
- **Quota usage:** <0.2%
- **Delay:** Max 15 minutes for new events
- **Still plenty of headroom** 

#### **Office/Business** (10-20 calendars)
```yaml
SYNC_INTERVAL=5  # Every 5 minutes
```
- **Daily API calls:** ~1,500-5,000
- **Quota usage:** <0.5%
- **Delay:** Max 10 minutes for new events
- **Very responsive** 

#### **Real-Time Updates** (Need immediate sync)
```yaml
SYNC_INTERVAL=1  # Every minute
```
- **Daily API calls:** ~3,000-30,000
- **Quota usage:** <3%
- **Delay:** Max 6 minutes for new events
- **Overkill but possible** 

### Optimal Configuration:

**For most users:** `SYNC_INTERVAL=15` (default)

**Reasoning:**
- Near-instant feels unnecessary for a home display
- 15-20 minute delay is acceptable
- Uses only 0.04% of quota
- Leaves 99.96% for other potential uses
- More efficient, less server load

## Cost Analysis

### Current Setup (15-min sync, 3 calendars)
- **API calls per month:** 384 × 30 = **11,520 calls**
- **Cost:** **$0.00** (FREE!)
- **Quota used:** 0.04% daily

### Maximum Practical Use (1-min sync, 20 calendars)
- **API calls per month:** 21 × 1,440 × 30 = **907,200 calls**
- **Cost:** **$0.00** (FREE!)
- **Quota used:** 91% daily (still under limit!)

### To Exceed Quota (Don't do this!)
You would need to sync:
- **Every 1 second** with 20 calendars, OR
- **Every 6 seconds** with 100 calendars, OR
- Intentionally spam the API

**Realistically impossible for normal usage!**

## Comparison with Paid APIs

### If Calendar API Were Paid (Hypothetical)
Industry standard pricing (like AWS, Azure):
- $0.001 per 1,000 API calls
- Our usage (15 min, 3 calendars): 11,520 calls/month
- **Would cost:** ~$0.01/month

**But it's FREE! **

## Monitoring API Usage

### Check Your Usage:
1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services → Dashboard**
4. Click **Calendar API**
5. View **Metrics** tab

### Set Up Quota Alerts (Optional):
1. In Google Cloud Console
2. Go to **IAM & Admin → Quotas**
3. Find "Calendar API - Requests per day"
4. Click **Edit quotas**
5. Set alert at 50% (500,000 requests/day)

**You'll never hit this, but good for peace of mind!**

## Edge Cases & Solutions

### Problem: Need faster updates for specific events

**Solution 1:** Manual sync button
```javascript
// Add sync button to UI
<button onClick={() => fetch('/api/calendar/sync', {method: 'POST'})}>
  Sync Now
</button>
```

**Solution 2:** Webhook (Advanced)
- Google Calendar supports push notifications
- Get notified immediately when calendars change
- Requires public HTTPS endpoint
- More complex setup

### Problem: Sharing display across timezones

**Solution:** No API impact!
- Times are converted client-side
- No extra API calls needed

### Problem: Many calendars from different accounts

**Solution:** OAuth per account
- Each account has separate quota
- Can sync 20 calendars per account
- Multiple accounts = multiple quotas

## Best Practices

1. **Start with 15-minute sync** - Adjust later if needed
2. **Monitor first week** - Check actual usage
3. **Don't sync during sleep** - Optional optimization:
   ```javascript
   // Only sync 6 AM - 11 PM
   cron.schedule('*/15 6-23 * * *', syncFunction);
   ```
4. **Cache is your friend** - SQLite stores data locally
5. **Frontend polls backend** - Not Google API directly

## Technical Details

### What Happens During Each Sync:

1. **List Calendars** (1 API call)
   ```
   GET https://www.googleapis.com/calendar/v3/users/me/calendarList
   ```

2. **Fetch Events per Calendar** (1 call each)
   ```
   GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
     ?timeMin=2025-01-01T00:00:00Z
     &timeMax=2025-02-15T00:00:00Z
     &maxResults=2500
     &singleEvents=true
   ```

3. **Store in SQLite** (No API calls)
   - Local database on your NAS
   - Instant reads for frontend
   - Only syncs changes to Google

### Efficient Sync with `syncToken`

After first sync, uses incremental sync:
```
GET .../events?syncToken=abc123
```
- Only fetches changed events
- Reduces response size
- Same API call count
- More efficient bandwidth

## Summary

### Quick Facts:
 **Google Calendar API is 100% FREE**
 **1,000,000 requests per day quota**
 **LumaWall uses <0.1% of quota**
 **Can sync every minute if desired**
 **No cost optimization needed**

### Recommended Settings:

**docker-compose.yml:**
```yaml
backend:
  environment:
    - SYNC_INTERVAL=15  # Every 15 minutes (default)
```

**Alternative options:**
- Fast updates: `SYNC_INTERVAL=5` (every 5 min)
- Balanced: `SYNC_INTERVAL=15` (every 15 min) 
- Conservative: `SYNC_INTERVAL=30` (every 30 min)

### Bottom Line:
**Sync as frequently as you want!** The API is free and you'll never hit the limits with a home display. The 15-minute default is for balance, not cost savings.

If you want near-real-time updates, set it to 1-5 minutes without worry! 
