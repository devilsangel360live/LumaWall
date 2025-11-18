#  LumaWall - Digital Photo Frame & Calendar

> A beautiful digital photo frame with integrated calendar, weather, and photo slideshow - designed to run on your NAS.

##  Features

-  **Monthly & Weekly Calendar** - View your schedule at a glance
-  **Photo Slideshow** - Display photos from your NAS with dual portrait mode
-  **Photo Collage** - Randomized artistic layouts
-  **Weather Panel** - Current weather, forecast, and interactive radar map (MapTiler)
-  **Auto-Rotation** - Cycles through different views automatically
-  **Vintage Design** - Beautiful, clean aesthetic with custom SVG weather icons

## Project Structure

```
LumaWall/
├── backend/          # Node.js API server
│   └── src/
│       ├── services/ # Business logic (calendar sync, data aggregation)
│       ├── routes/   # API endpoints
│       ├── db/       # SQLite cache
│       └── config/   # Configuration files
├── frontend/         # React UI
│   └── src/
│       ├── components/ # React components (DailyView, TimelineView, etc.)
│       ├── hooks/      # Custom React hooks
│       ├── utils/      # Helper functions
│       └── styles/     # CSS and theme files
└── docs/             # Documentation
```

##  Quick Start

**For NAS Deployment** (Recommended):
```bash
# See QUICK_START.md for 5-minute setup
ssh user@omv6.local
mkdir -p /srv/lumawall && cd /srv/lumawall
# Copy project files here
echo "VITE_MAPTILER_API_KEY=your_key" > .env
# Update photo path in docker-compose.yml
docker-compose up -d
```

**Access**: http://your-nas-ip

 **Screen Rotation**: Monthly View (5s) → Weekly View (5s) → Slideshow (20s) → Collage (10s) → Weather (15s)

##  Documentation

- **[QUICK_START.md](QUICK_START.md)** - Deploy in 5 minutes 
- **[DEPLOYMENT_NAS.md](DEPLOYMENT_NAS.md)** - Complete NAS deployment guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Generic server deployment

##  Requirements

- NAS with Docker support (OpenMediaVault, Synology, QNAP, etc.)
- ~150MB RAM
- Photos stored on NAS
- MapTiler API key (free tier available)

## Tech Stack

**Backend:**
- Node.js + Express
- Photo serving from NAS
- NOAA Weather API

**Frontend:**
- React + Vite + Tailwind CSS
- MapTiler SDK with weather layers
- date-fns for date handling
- Custom SVG weather icons

**Deployment:**
- Docker + Docker Compose
- Nginx for production serving

##  Customization

- **Weather Icons**: Place SVG files in `frontend/src/assets/icons/weather/`
- **Screen Timing**: Edit durations in `frontend/src/App.jsx`
- **Photo Source**: Update volume mount in `docker-compose.yml`
- **Colors & Themes**: Customize in `frontend/src/config/backgrounds.js`

##  Security

- Photos mounted read-only
- No external database
- API keys in `.env` (not committed)
- Containers isolated in private network

##  Resource Usage

- RAM: ~150MB total
- CPU: Minimal
- Network: ~5K MapTiler requests/month (free tier)
- Storage: ~500MB for Docker images

##  Acknowledgments

- Weather data: NOAA/National Weather Service
- Maps: MapTiler
- Icons: Custom SVG weather icons collection

## License

MIT - Use freely for personal or commercial projects
