# MapTiler Weather Map Setup Guide

The WeatherPanel uses MapTiler for high-resolution maps with multiple weather layer overlays.

## Free Tier Limits & Optimization

MapTiler's free tier includes:
- **5,000 map sessions per month**
- **100,000 tile requests per month**

To stay within the free tier, the map is:
-  **Cached and only recreated every 30 minutes** (not on every screen rotation)
-  **One session per 30 minutes** = ~1,440 sessions/month (well under 5K limit)
-  Console logs show when map refreshes

## Step 1: Get Your MapTiler API Key

1. Go to https://cloud.maptiler.com/account/keys/
2. Sign in to your MapTiler account
3. Copy your API key from the dashboard

## Step 2: Configure the API Key

Add your MapTiler API key to the frontend environment file:

```bash
cd frontend
nano .env
```

Add this line with your actual API key:
```
VITE_MAPTILER_API_KEY=your_actual_api_key_here
```

**Important:** The key MUST start with `VITE_` for Vite to expose it to the browser.

## Step 3: Restart the Frontend

After adding the API key, restart the frontend development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Features

The weather panel now includes:

- **Left Side:**
  - Current temperature and conditions
  - Weather icon (animated)
  - Humidity and wind speed
  - 5-period forecast

- **Right Side:**
  - Interactive MapTiler map centered on Boston
  - Hybrid satellite/street view
  - **Three weather layer options** (toggle with buttons):
    -  **Precipitation** - Rain/snow radar with color-coded intensity
    -  **Temperature** - Temperature overlay with heat map
    -  **Wind** - Wind speed/direction with animated particles
  - Weather layers from MapTiler Weather SDK
  - Auto-refresh every 30 minutes

## Map Controls

- **Zoom:** Scroll wheel or +/- buttons
- **Pan:** Click and drag
- **Rotate:** Right-click and drag (or Ctrl+drag)

## Weather Data Sources

- **Current Weather & Forecast:** National Weather Service (NWS) API (free)
- **Base Map:** MapTiler hybrid satellite + streets (5K sessions/month free)
- **Weather Layers:** MapTiler Weather SDK (included in map sessions)
  - Precipitation layer with 4-day forecast
  - Temperature layer with hourly precision
  - Wind layer with animated particles
  - Global coverage, updated every ~6 hours

## Troubleshooting

### Map doesn't appear
- Check that your API key is correctly set in `frontend/.env`
- Ensure the key starts with `VITE_`
- Restart the frontend server after adding the key
- Check browser console for errors

### API Key Error
If you see "MapTiler API Key Required":
- The `.env` file wasn't loaded properly
- Make sure the file is in `/frontend/.env` (not `/backend/.env`)
- Restart the development server

### Radar overlay not showing
- This is normal if there's no current precipitation
- The radar data comes from RainViewer and updates in real-time
- Check during rainy weather to see the overlay

## MapTiler Free Tier

The free tier includes:
- 100,000 map loads per month
- Sufficient for personal use
- No credit card required

For a digital photo frame running 24/7, the weather panel appears for 15 seconds every ~60 seconds of rotation, which is well within the free tier limits.

## Customization

### Change Map Style

Edit `WeatherPanel.jsx` line ~115 to use different map styles:

- **Satellite:** `https://api.maptiler.com/maps/satellite/style.json`
- **Streets:** `https://api.maptiler.com/maps/streets-v2/style.json`
- **Hybrid:** `https://api.maptiler.com/maps/hybrid/style.json` (current)
- **Topo:** `https://api.maptiler.com/maps/topo-v2/style.json`

### Change Location

Edit `WeatherPanel.jsx` lines 12-13:

```javascript
const BOSTON_LAT = 42.3601  // Change to your latitude
const BOSTON_LON = -71.0589 // Change to your longitude
```

### Adjust Radar Opacity

Edit `WeatherPanel.jsx` line ~136:

```javascript
'raster-opacity': 0.7  // Change from 0.0 (transparent) to 1.0 (opaque)
```

## API Documentation

- MapTiler: https://docs.maptiler.com/sdk-js/
- RainViewer: https://www.rainviewer.com/api.html
- NWS API: https://www.weather.gov/documentation/services-web-api
