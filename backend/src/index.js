import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import calendarRoutes from './routes/calendar.js';
import photosRoutes from './routes/photos.js';
import newsRoutes from './routes/news.js';
import nasaRoutes from './routes/nasa.js';
import entertainmentRoutes from './routes/entertainment.js';
import newsService from './services/newsService.js';

// Note: fetch is built-in for Node 18+

// Load environment variables from parent directory (root of project)
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
console.log(' Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(' Error loading .env:', result.error);
} else {
  console.log(' .env loaded successfully');
}

// Debug: Check if keys loaded
console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? ' Loaded' : ' Missing');
console.log('ASTRONOMY_APP_ID:', process.env.ASTRONOMY_APP_ID ? ' Loaded' : ' Missing');
console.log('ASTRONOMY_APP_SECRET:', process.env.ASTRONOMY_APP_SECRET ? ' Loaded' : ' Missing');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Basic health check (duplicate route so Docker healthcheck path matches)
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'lumawall-backend'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Calendar routes
app.use('/api/calendar', calendarRoutes);

// Photos routes
app.use('/api/photos', photosRoutes);

// News routes
app.use('/api/news', newsRoutes);

// NASA routes
app.use('/api/nasa', nasaRoutes);

// Entertainment routes
app.use('/api/entertainment', entertainmentRoutes);

// Auto-sync calendar with Google every 1 minute
const syncInterval = process.env.SYNC_INTERVAL || 1;
console.log(`Setting up calendar auto-sync: every ${syncInterval} minutes`);

cron.schedule(`*/${syncInterval} * * * *`, async () => {
  console.log(' Running scheduled calendar sync...');
  try {
    const response = await fetch('http://localhost:3001/api/calendar/sync', {
      method: 'POST'
    });
    if (response.ok) {
      const result = await response.json();
      console.log(' Calendar sync complete:', result.totalEvents, 'events synced');
    } else {
      console.error(' Calendar sync failed:', response.statusText);
    }
  } catch (error) {
    console.error(' Calendar sync error:', error.message);
  }
});

// Auto-sync news feeds every 15 minutes
console.log('Setting up news auto-sync: every 15 minutes');

cron.schedule('*/15 * * * *', async () => {
  console.log(' Running scheduled news sync...');
  try {
    const result = await newsService.fetchAllFeeds();
    console.log(` News sync complete: ${result.totalArticles} articles from ${result.totalFeeds} feeds`);
  } catch (error) {
    console.error(' News sync error:', error.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, async () => {
  console.log(` LumaWall backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Run initial calendar sync on startup (with small delay to ensure server is ready)
  setTimeout(async () => {
    console.log(' Running initial calendar sync on startup...');
    try {
      const response = await fetch(`http://localhost:${PORT}/api/calendar/sync`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        console.log(' Initial calendar sync complete:', result.totalEvents, 'events synced');
      } else {
        console.error(' Initial calendar sync failed:', response.statusText);
      }
    } catch (error) {
      console.error(' Initial calendar sync error:', error.message);
    }
  }, 2000);

  // Run initial news sync on startup
  setTimeout(async () => {
    console.log(' Running initial news sync on startup...');
    try {
      const result = await newsService.fetchAllFeeds();
      console.log(` Initial news sync complete: ${result.totalArticles} articles from ${result.totalFeeds} feeds`);
    } catch (error) {
      console.error(' Initial news sync error:', error.message);
    }
  }, 3000); // Wait 3 seconds to stagger with calendar sync
});
