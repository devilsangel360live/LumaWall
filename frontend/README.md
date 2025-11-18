# LumaWall Frontend

React-based frontend for the LumaWall smart home display.

## Features

- Beautiful, ambient calendar display
- Daily view with detailed event cards
- Timeline view (T-7 to T+30 days)
- Optional month view
- Aurora-themed color palette
- Glassmorphic design
- Real-time clock
- Auto-refresh every 5 minutes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Configuration

The frontend automatically connects to the backend at `http://localhost:3001` via Vite proxy configuration.

For production, update the proxy settings in [vite.config.js](vite.config.js).

## Components

### DailyView
Displays today's events in a vertical list with full details.

### TimelineView
Shows events across a T-7 to T+30 day range, grouped by date.

### MonthView
Traditional calendar grid view for the current month (optional).

## Hooks

### useCalendarData
Fetches and manages calendar event data from the backend.

```javascript
const { todayEvents, timelineEvents, loading, error, refetch } = useCalendarData()
```

### useCalendarManagement
Manages calendar configuration and sync operations.

```javascript
const { calendars, syncCalendars, getAuthUrl } = useCalendarManagement()
```

## Theme

The app uses the Aurora Home color palette:

- Navy: `#0F1729`
- Deep Blue: `#1A2332`
- Indigo: `#2D3B5F`
- Cyan: `#5DD9E8`
- Coral: `#FF6B6B`
- Off White: `#F7F7F2`

Customizable via [tailwind.config.js](tailwind.config.js).

## Display Optimization

### Recommended Settings for Kiosk Mode

For Raspberry Pi or dedicated display:

1. Install Chromium
2. Run in kiosk mode:
```bash
chromium-browser --kiosk --disable-restore-session-state http://localhost:5173
```

3. Hide cursor (install `unclutter`):
```bash
sudo apt-get install unclutter
unclutter -idle 0
```

### Screen Resolution

Optimized for:
- 1920x1080 (1080p)
- 3840x2160 (4K)

The layout is responsive and adapts to different screen sizes.

## Development

- Uses Vite for fast HMR
- TailwindCSS for styling
- date-fns for date manipulation
- ESLint for code quality

## TODO

- [ ] Touch/swipe navigation
- [ ] Settings panel
- [ ] Calendar color customization
- [ ] Animations and transitions
- [ ] Dark/light theme toggle
- [ ] Weather widget integration
