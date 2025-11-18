# Entertainment Panel Setup Guide

The Entertainment Panel combines movies currently in theaters, astronomical star charts, and historical events from "today in history".

## Features

-  **Movies in Theaters**: Rotating display of current theatrical releases with posters, ratings, and descriptions
-  **Star Chart**: Real-time astronomical chart showing constellations and stars for your location
-  **Today in History**: Historical events, births, and deaths from this day in history

## API Configuration

### 1. TMDB API (Movies) - FREE

1. Sign up at https://www.themoviedb.org/signup
2. Go to https://www.themoviedb.org/settings/api
3. Request an API key (choose "Developer" option)
4. Copy your API key

**Add to `.env`:**
```bash
TMDB_API_KEY=your_tmdb_api_key_here
```

### 2. AstronomyAPI (Star Charts) - Possibly FREE

1. Sign up at https://astronomyapi.com
2. Get your Application ID and Secret from the dashboard
3. Note: Check their pricing - may have a free tier

**Add to `.env`:**
```bash
ASTRONOMY_APP_ID=your_astronomy_app_id_here
ASTRONOMY_APP_SECRET=your_astronomy_app_secret_here
```

### 3. Location Configuration

Set your NAS location coordinates for accurate star charts:

**Find your coordinates:**
- Go to https://www.latlong.net/
- Search for your city
- Copy latitude and longitude

**Add to `.env`:**
```bash
LOCATION_LATITUDE=42.2001
LOCATION_LONGITUDE=-74.0060
```

### 4. Wikipedia API (History) - FREE

No configuration needed! Wikipedia's "On This Day" API is completely free and requires no API key.

## Complete .env Configuration

Add these lines to your `.env` file:

```bash
# ===== Entertainment Panel Configuration =====
# TMDB API for movie listings
TMDB_API_KEY=your_actual_tmdb_key

# AstronomyAPI for star charts
ASTRONOMY_APP_ID=your_actual_app_id
ASTRONOMY_APP_SECRET=your_actual_app_secret

# Location for star chart
LOCATION_LATITUDE=42.2001
LOCATION_LONGITUDE=-74.0060
```

## Layout

```
┌─────────────────────────────────────────────┐
│  MOVIES (Top Left)     │   STAR CHART       │
│  ┌──────────────────┐  │   (Center/Right)   │
│  │ Movie 1          │  │                    │
│  │ Movie 2          │  │    Full night   │
│  │ Movie 3          │  │   sky view with    │
│  └──────────────────┘  │   constellations   │
│  ─────────────────────┤                    │
│  TODAY IN HISTORY      │                    │
│  ┌──────────────────┐  │                    │
│  │ 1963 - Event 1   │  │                    │
│  │ 1985 - Event 2   │  │                    │
│  │ 2001 - Event 3   │  │                    │
│  └──────────────────┘  │                    │
└─────────────────────────────────────────────┘
```

## Deployment

After adding API keys to `.env`:

**Local Development:**
```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

**Deploy to NAS:**
```bash
# Copy updated files
scp .env root@omv6.local:/home/LumaWall/
scp backend/src/services/entertainmentService.js root@omv6.local:/home/LumaWall/backend/src/services/
scp backend/src/routes/entertainment.js root@omv6.local:/home/LumaWall/backend/src/routes/
scp backend/src/index.js root@omv6.local:/home/LumaWall/backend/src/
scp frontend/src/components/EntertainmentPanel.jsx root@omv6.local:/home/LumaWall/frontend/src/components/
scp frontend/src/App.jsx root@omv6.local:/home/LumaWall/frontend/src/

# On NAS, rebuild
ssh root@omv6.local
cd /home/LumaWall
docker-compose down
docker-compose build
docker-compose up -d
```

## Screen Rotation

The Entertainment Panel is now part of the automatic screen rotation:
- **Monthly Calendar**: 20 seconds
- **Weekly Timeline**: 20 seconds
- **Photo Slideshow**: 20 seconds
- **Photo Collage**: 20 seconds
- **Weather Panel**: 20 seconds
- **News Panel**: 30 seconds
- **Entertainment Panel**: 30 seconds ← NEW!

## Features

### Movies Display
- Shows 3 movies at a time
- Rotates through up to 12 currently playing movies
- Changes every 5 seconds
- Displays: poster, title, rating, year, description
- Cached for 6 hours

### Star Chart
- Updates hourly
- Shows current night sky for your location
- Includes constellations and celestial objects
- Cached for 1 hour

### Today in History
- Updates daily at midnight
- Shows events, births, and deaths from this day
- Up to 6 historical items displayed
- Automatically cached per day

## API Limits

- **TMDB**: 1000 requests/day (free tier) - plenty for hourly updates
- **Wikipedia**: No limits, completely free
- **AstronomyAPI**: Check their website for current pricing/limits

## Troubleshooting

### Movies not showing
- Check `TMDB_API_KEY` is correct in `.env`
- Verify backend logs: `docker-compose logs backend | grep TMDB`

### Star chart not showing
- Check `ASTRONOMY_APP_ID` and `ASTRONOMY_APP_SECRET` in `.env`
- Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Check backend logs: `docker-compose logs backend | grep Astronomy`

### History not showing
- Should always work (no API key needed)
- Check backend logs: `docker-compose logs backend | grep History`

## Testing

Test individual endpoints:

```bash
# Test movies
curl http://localhost:3001/api/entertainment/movies

# Test history
curl http://localhost:3001/api/entertainment/history

# Test star chart
curl http://localhost:3001/api/entertainment/star-chart

# Test all at once
curl http://localhost:3001/api/entertainment/all
```
