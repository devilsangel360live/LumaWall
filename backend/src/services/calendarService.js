import { google } from 'googleapis';
import db from '../config/database.js';
import { startOfDay, endOfDay, addDays, subDays, parseISO } from 'date-fns';
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'tokens.json');

class CalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.loadTokens(); // Load tokens on startup
  }

  /**
   * Load OAuth tokens from file
   */
  loadTokens() {
    try {
      if (fs.existsSync(TOKENS_FILE)) {
        const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        console.log(' Loaded OAuth tokens from file');
        this.initializeAuth(tokens);
      } else {
        console.log('  No saved OAuth tokens found. Please authenticate at: http://YOUR_NAS_IP:3001/api/calendar/auth/url');
      }
    } catch (error) {
      console.error(' Error loading OAuth tokens:', error.message);
    }
  }

  /**
   * Save OAuth tokens to file
   */
  saveTokens(tokens) {
    try {
      const dataDir = path.dirname(TOKENS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
      console.log(' Saved OAuth tokens to file');
    } catch (error) {
      console.error(' Error saving OAuth tokens:', error.message);
    }
  }

  /**
   * Initialize OAuth2 client with credentials
   */
  initializeAuth(credentials) {
    // For Desktop App flow, use OOB (out-of-band) redirect
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    if (credentials) {
      this.oauth2Client.setCredentials(credentials);
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl() {
    if (!this.oauth2Client) {
      this.initializeAuth();
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    if (!this.oauth2Client) {
      this.initializeAuth();
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Save tokens to file for persistence
    this.saveTokens(tokens);

    return tokens;
  }

  /**
   * Fetch calendar list from Google
   */
  async fetchCalendarList() {
    try {
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];

      // Filter to only allowed calendars by ID (more reliable than name)
      const ALLOWED_CALENDAR_IDS = [
        'arindam.andy.pal@gmail.com',  // Arindam Pal (primary)
        'f6a8a6c968f4069447d1ef5a6d66dad63f7d18166cc0740c4898fb1f2b2f5005@group.calendar.google.com',  // family for MM2
        'nfl_-m-05g3b_%4eew+%45ngland+%50atriots#sports@group.v.calendar.google.com'  // New England Patriots
      ];

      console.log(`\nFound ${calendars.length} total calendars:`);
      calendars.forEach(cal => {
        console.log(`  - "${cal.summary}" (${cal.id})`);
      });

      const filteredCalendars = calendars.filter(cal => {
        const isAllowed = ALLOWED_CALENDAR_IDS.includes(cal.id);
        if (!isAllowed) {
          console.log(`   Excluding: "${cal.summary}" (${cal.id})`);
        }
        return isAllowed;
      });

      console.log(`\nFiltered to ${filteredCalendars.length} allowed calendars:`);
      filteredCalendars.forEach(cal => {
        console.log(`   ${cal.summary} (${cal.id})`);
      });

      // Store calendars in database
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO calendars (id, name, color, timezone, access_role, last_synced)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const cal of filteredCalendars) {
        stmt.run(
          cal.id,
          cal.summary,
          cal.backgroundColor || '#3B82F6',
          cal.timeZone,
          cal.accessRole,
          now
        );
      }

      return filteredCalendars;
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw error;
    }
  }

  /**
   * Sync events from a specific calendar
   * @param {string} calendarId - Google Calendar ID
   * @param {number} daysBefore - Days before today to fetch (default: 7)
   * @param {number} daysAfter - Days after today to fetch (default: 30)
   */
  async syncCalendarEvents(calendarId, daysBefore = 7, daysAfter = 30) {
    try {
      // Check if calendar is initialized
      if (!this.calendar) {
        throw new Error('Calendar not initialized. Please authenticate first.');
      }

      const timeMin = subDays(startOfDay(new Date()), daysBefore).toISOString();
      const timeMax = addDays(endOfDay(new Date()), daysAfter).toISOString();

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      const events = response.data.items || [];
      const calendarInfo = this.getCalendarInfo(calendarId);

      // Clear ALL old events for this calendar (not just date range)
      // This ensures we remove events that may have been deleted or moved
      db.prepare(`
        DELETE FROM calendar_events
        WHERE calendar_id = ?
      `).run(calendarId);

      // Insert or replace events (handles duplicates)
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO calendar_events (
          id, calendar_id, calendar_name, calendar_color,
          summary, description, location,
          start_datetime, end_datetime, all_day, recurring, status,
          raw_data, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const event of events) {
        const startDateTime = event.start.dateTime || event.start.date;
        const endDateTime = event.end.dateTime || event.end.date;
        const isAllDay = !event.start.dateTime;

        stmt.run(
          event.id,
          calendarId,
          calendarInfo?.name || 'Unknown',
          calendarInfo?.color || '#3B82F6',
          event.summary || '(No title)',
          event.description || null,
          event.location || null,
          startDateTime,
          endDateTime,
          isAllDay ? 1 : 0,
          event.recurringEventId ? 1 : 0,
          event.status,
          JSON.stringify(event),
          now
        );
      }

      // Log sync
      db.prepare(`
        INSERT INTO sync_log (calendar_id, status, events_count, synced_at)
        VALUES (?, ?, ?, ?)
      `).run(calendarId, 'success', events.length, now);

      console.log(`Synced ${events.length} events from calendar: ${calendarId}`);
      return events;
    } catch (error) {
      console.error(`Error syncing calendar ${calendarId}:`, error);

      // Log error
      db.prepare(`
        INSERT INTO sync_log (calendar_id, status, events_count, error_message, synced_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(calendarId, 'error', 0, error.message, new Date().toISOString());

      throw error;
    }
  }

  /**
   * Get calendar info from database
   */
  getCalendarInfo(calendarId) {
    return db.prepare('SELECT * FROM calendars WHERE id = ?').get(calendarId);
  }

  /**
   * Get events from local cache
   */
  getEventsFromCache(startDate, endDate) {
    const events = db.prepare(`
      SELECT * FROM calendar_events
      WHERE start_datetime >= ? AND start_datetime <= ?
      ORDER BY start_datetime ASC
    `).all(startDate, endDate);

    return events.map(event => ({
      ...event,
      all_day: Boolean(event.all_day),
      recurring: Boolean(event.recurring),
      raw_data: event.raw_data ? JSON.parse(event.raw_data) : null
    }));
  }

  /**
   * Get today's events
   */
  getTodaysEvents() {
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    return this.getEventsFromCache(startOfToday, endOfToday);
  }

  /**
   * Get events for the timeline view (T-7 to T+30)
   */
  getTimelineEvents() {
    const today = new Date();
    const start = subDays(startOfDay(today), 7).toISOString();
    const end = addDays(endOfDay(today), 30).toISOString();

    return this.getEventsFromCache(start, end);
  }

  /**
   * Get all enabled calendars
   */
  getEnabledCalendars() {
    return db.prepare('SELECT * FROM calendars WHERE enabled = 1').all();
  }
}

export default new CalendarService();
