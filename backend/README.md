# LumaWall Backend

Node.js backend API for the LumaWall smart home display.

## Features

- Google Calendar API integration with OAuth2
- Multi-calendar support with color-coding
- Local SQLite caching for offline support
- Automatic sync scheduling
- RESTful API endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Google Calendar API credentials:
- Get credentials from: https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID
- Add authorized redirect URI: `http://localhost:3001/auth/google/callback`

3. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `GET /api/calendar/auth/url` - Get Google OAuth authorization URL
- `POST /api/calendar/auth/callback` - Exchange authorization code for tokens

### Calendars

- `GET /api/calendar/list` - Fetch calendar list from Google
- `GET /api/calendar/calendars` - Get enabled calendars from database
- `POST /api/calendar/sync` - Manually trigger calendar sync

### Events

- `GET /api/calendar/events/today` - Get today's events
- `GET /api/calendar/events/timeline` - Get timeline events (T-7 to T+30)
- `GET /api/calendar/events?start={ISO}&end={ISO}` - Get events for custom date range

### Health

- `GET /health` - Server health check

## Google Calendar Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API

### 2. Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select "Web application"
4. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 3. Authenticate

1. Start the backend server
2. Navigate to `http://localhost:3001/api/calendar/auth/url`
3. Copy the authorization URL and open it in a browser
4. Authorize the application
5. Copy the authorization code from the redirect URL
6. Send a POST request to `/api/calendar/auth/callback` with the code

## Database Schema

The backend uses SQLite with the following tables:

- `calendar_events` - Cached calendar events
- `calendars` - Calendar metadata
- `sync_log` - Sync history and errors

## Development

Run in watch mode:
```bash
npm run dev
```

The server will automatically restart on file changes.

## TODO

- [ ] Secure token storage (encryption)
- [ ] Token refresh logic
- [ ] Multiple account support
- [ ] Rate limiting
- [ ] Error recovery and retry logic
