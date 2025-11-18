import express from 'express';
import calendarService from '../services/calendarService.js';

const router = express.Router();

/**
 * GET /api/calendar/auth/url
 * Get Google OAuth authorization URL
 */
router.get('/auth/url', (req, res) => {
  try {
    const authUrl = calendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/auth/callback
 * Handle OAuth callback from Google (browser redirect)
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h2> Authorization Failed</h2>
            <p>Error: ${error}</p>
            <p><a href="/">Try again</a></p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h2> No Authorization Code</h2>
            <p>Authorization code is missing from the callback.</p>
          </body>
        </html>
      `);
    }

    const tokens = await calendarService.getTokensFromCode(code);

    // TODO: Store tokens securely (encrypted file or secure storage)

    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h2> Authorization Successful!</h2>
          <p>LumaWall has been authorized to access your Google Calendar.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Next Steps:</h3>
            <ol>
              <li>Fetch your calendar list</li>
              <li>Sync your events</li>
              <li>Start the frontend to view your calendar</li>
            </ol>
          </div>
          <pre style="background: #1a1a1a; color: #0f0; padding: 15px; border-radius: 5px; overflow-x: auto;">
# Fetch calendar list
curl http://localhost:3001/api/calendar/list

# Trigger sync
curl -X POST http://localhost:3001/api/calendar/sync

# Start frontend
cd frontend && npm run dev
          </pre>
          <p style="color: #666; font-size: 14px;">You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h2> Error Processing Authorization</h2>
          <p>${error.message}</p>
          <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${error.stack}</pre>
        </body>
      </html>
    `);
  }
});

/**
 * POST /api/calendar/auth/callback
 * Handle OAuth callback with authorization code (API version)
 */
router.post('/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const tokens = await calendarService.getTokensFromCode(code);

    // TODO: Store tokens securely (encrypted file or secure storage)
    // For now, just return success
    res.json({
      success: true,
      message: 'Authentication successful. Tokens received.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/list
 * Get all available calendars
 */
router.get('/list', async (req, res) => {
  try {
    const calendars = await calendarService.fetchCalendarList();
    res.json(calendars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/calendars
 * Get enabled calendars from database
 */
router.get('/calendars', (req, res) => {
  try {
    const calendars = calendarService.getEnabledCalendars();
    res.json(calendars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/sync
 * Manually trigger calendar sync
 */
router.post('/sync', async (req, res) => {
  try {
    // First, refresh the calendar list to get latest filtered calendars
    await calendarService.fetchCalendarList();

    const calendars = calendarService.getEnabledCalendars();
    const results = [];

    // Get list of allowed calendar IDs
    const allowedCalendarIds = calendars.map(c => c.id);

    // Delete events from calendars that are no longer in the allowed list
    const db = await import('../config/database.js').then(m => m.default);
    const deletedCount = db.prepare(`
      DELETE FROM calendar_events
      WHERE calendar_id NOT IN (${allowedCalendarIds.map(() => '?').join(',')})
    `).run(...allowedCalendarIds);

    console.log(`Cleaned up ${deletedCount.changes} events from unauthorized calendars`);

    for (const calendar of calendars) {
      try {
        const events = await calendarService.syncCalendarEvents(calendar.id);
        results.push({
          calendarId: calendar.id,
          calendarName: calendar.name,
          success: true,
          eventsCount: events.length
        });
      } catch (error) {
        results.push({
          calendarId: calendar.id,
          calendarName: calendar.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/events/today
 * Get today's events from cache
 */
router.get('/events/today', (req, res) => {
  try {
    const events = calendarService.getTodaysEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/events/timeline
 * Get timeline events (T-7 to T+30) from cache
 */
router.get('/events/timeline', (req, res) => {
  try {
    const events = calendarService.getTimelineEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/events
 * Get events for a custom date range
 */
router.get('/events', (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: 'Both start and end dates required (ISO 8601 format)'
      });
    }

    const events = calendarService.getEventsFromCache(start, end);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
