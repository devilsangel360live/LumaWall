#!/usr/bin/env node

/**
 * Google Calendar OAuth Authentication Helper
 *
 * This script performs one-time authentication with Google Calendar
 * and saves the tokens to backend/data/tokens.json
 *
 * Usage:
 *   1. Make sure you have a Desktop App OAuth client in Google Cloud Console
 *   2. Create a .env file with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 *   3. Run: node authenticate-google.js
 *   4. Follow the prompts to authorize
 *   5. Copy backend/data/tokens.json to your NAS
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKENS_FILE = path.join(__dirname, 'backend', 'data', 'tokens.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// For Desktop App flow, redirect URI should be this special loopback address
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

async function authenticate() {
  console.log('='.repeat(60));
  console.log('Google Calendar Authentication Helper');
  console.log('='.repeat(60));
  console.log();

  // Check for required environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error(' Error: Missing Google OAuth credentials');
    console.error('');
    console.error('Please create a .env file with:');
    console.error('  GOOGLE_CLIENT_ID=your_client_id');
    console.error('  GOOGLE_CLIENT_SECRET=your_client_secret');
    console.error('');
    console.error('Get these from: https://console.cloud.google.com/apis/credentials');
    console.error('Make sure to create a "Desktop App" OAuth client, not "Web Application"');
    process.exit(1);
  }

  console.log(' Loaded OAuth credentials from .env');
  console.log('  Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  console.log();

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log(' Step 1: Authorize this app');
  console.log('─'.repeat(60));
  console.log();
  console.log('Open this URL in your browser:');
  console.log();
  console.log('\x1b[36m%s\x1b[0m', authUrl);
  console.log();
  console.log('After authorizing, Google will show you an authorization code.');
  console.log();

  // Get authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const code = await new Promise((resolve) => {
    rl.question(' Paste the authorization code here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  console.log();
  console.log(' Exchanging code for tokens...');

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log(' Successfully obtained tokens!');
    console.log();
    console.log('Token details:');
    console.log('  - Access Token:', tokens.access_token ? ' Present' : ' Missing');
    console.log('  - Refresh Token:', tokens.refresh_token ? ' Present' : ' Missing');
    console.log('  - Expiry Date:', tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A');
    console.log();

    // Ensure data directory exists
    const dataDir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(' Created data directory:', dataDir);
    }

    // Save tokens to file
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log(' Saved tokens to:', TOKENS_FILE);
    console.log();

    // Test the tokens by fetching calendar list
    console.log(' Testing tokens by fetching calendar list...');
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    console.log(' Successfully connected to Google Calendar!');
    console.log();
    console.log('Found calendars:');
    response.data.items.forEach((cal, index) => {
      console.log(`  ${index + 1}. ${cal.summary} (${cal.id})`);
    });
    console.log();

    // Instructions for deployment
    console.log('='.repeat(60));
    console.log(' Authentication Complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log();
    console.log('1. Copy tokens.json to your NAS:');
    console.log();
    console.log('   scp backend/data/tokens.json user@omv6.local:/home/LumaWall/backend/data/');
    console.log();
    console.log('2. Make sure docker-compose.yml has the volume mount:');
    console.log();
    console.log('   volumes:');
    console.log('     - ./backend/data:/app/data');
    console.log();
    console.log('3. Restart the backend container:');
    console.log();
    console.log('   ssh user@omv6.local "cd /home/LumaWall && docker-compose restart backend"');
    console.log();
    console.log('4. Verify auto-sync is working:');
    console.log();
    console.log('   ssh user@omv6.local "cd /home/LumaWall && docker-compose logs backend | grep sync"');
    console.log();
    console.log('The refresh token will keep working indefinitely!');
    console.log('No need to re-authenticate unless you revoke access.');
    console.log();

  } catch (error) {
    console.error(' Error exchanging code for tokens:', error.message);
    console.error();
    console.error('Troubleshooting:');
    console.error('  - Make sure you copied the ENTIRE authorization code');
    console.error('  - Make sure your OAuth client is type "Desktop App"');
    console.error('  - Try generating a new authorization URL and code');
    process.exit(1);
  }
}

// Run authentication
authenticate().catch((error) => {
  console.error(' Unexpected error:', error);
  process.exit(1);
});
