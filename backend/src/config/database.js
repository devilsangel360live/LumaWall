import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../db/cache.db');

// Ensure db directory exists
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    calendar_id TEXT NOT NULL,
    calendar_name TEXT,
    calendar_color TEXT,
    summary TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_datetime TEXT NOT NULL,
    end_datetime TEXT NOT NULL,
    all_day INTEGER DEFAULT 0,
    recurring INTEGER DEFAULT 0,
    status TEXT,
    raw_data TEXT,
    synced_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_calendar_id ON calendar_events(calendar_id);
  CREATE INDEX IF NOT EXISTS idx_start_datetime ON calendar_events(start_datetime);
  CREATE INDEX IF NOT EXISTS idx_end_datetime ON calendar_events(end_datetime);

  CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    timezone TEXT,
    access_role TEXT,
    enabled INTEGER DEFAULT 1,
    last_synced TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendar_id TEXT NOT NULL,
    status TEXT NOT NULL,
    events_count INTEGER,
    error_message TEXT,
    synced_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- News feeds configuration
  CREATE TABLE IF NOT EXISTS news_feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 1,
    last_fetched TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- News articles cache (latest 20 per feed)
  CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    feed_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    pub_date TEXT NOT NULL,
    author TEXT,
    image_url TEXT,
    source TEXT NOT NULL,
    content TEXT,
    raw_data TEXT,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feed_id) REFERENCES news_feeds(id)
  );

  CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
  CREATE INDEX IF NOT EXISTS idx_news_pub_date ON news_articles(pub_date);
  CREATE INDEX IF NOT EXISTS idx_news_feed_id ON news_articles(feed_id);
`);

console.log('Database initialized at:', dbPath);

export default db;
