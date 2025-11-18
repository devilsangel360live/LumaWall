import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

console.log('Testing OAuth Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
console.log('- GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || '✗ Missing');
console.log();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ OAuth credentials not configured in .env file');
  process.exit(1);
}

// Test OAuth2 client creation
try {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  console.log('✓ OAuth2 client created successfully\n');

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent'
  });

  console.log('✓ Authorization URL generated successfully\n');
  console.log('Auth URL:');
  console.log(authUrl);
  console.log();
  console.log('Next steps:');
  console.log('1. Open the URL above in your browser');
  console.log('2. Make sure you added yourself as a test user in Google Cloud Console');
  console.log('3. Sign in and authorize the app');
  console.log('4. Copy the code from the redirect URL');
  console.log();

} catch (error) {
  console.error('❌ Error creating OAuth client:');
  console.error(error.message);
  console.error('\nPossible issues:');
  console.error('- Invalid CLIENT_ID or CLIENT_SECRET format');
  console.error('- Missing googleapis package');
  process.exit(1);
}
