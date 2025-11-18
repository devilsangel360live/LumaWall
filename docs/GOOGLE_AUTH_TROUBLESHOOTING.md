# Google OAuth Troubleshooting Guide

## "Access blocked: LumaWall has not completed the Google verification process"

This error occurs because your OAuth app is in **Testing** mode. Here are the solutions:

### Solution 1: Add Yourself as a Test User (Recommended for Development)

This is the quickest solution for personal use:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your LumaWall project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Enter your Google email address (the one you want to access calendars from)
7. Click **Save**
8. Try the authorization flow again

**Important:** You can add up to 100 test users. Add all Google accounts whose calendars you want to access.

### Solution 2: Publish Your App (For Production)

If you want to make the app publicly available (not recommended for personal use):

1. Go to **OAuth consent screen**
2. Fill in all required information:
   - App name: LumaWall
   - User support email
   - App logo (optional)
   - Developer contact information
3. Click **SAVE AND CONTINUE**
4. Add scopes (already done)
5. Click **PUBLISH APP**
6. Note: For sensitive scopes like calendar, Google may require verification

### Solution 3: Use Internal User Type (G Suite/Workspace Only)

If you have a Google Workspace account:

1. Go to **OAuth consent screen**
2. Change **User Type** from "External" to "Internal"
3. This restricts access to users in your organization only
4. No verification needed

## Additional Tips

### Bypassing the Warning Screen

Even with test users added, you might see a warning:

**"Google hasn't verified this app"**

This is normal for apps in testing. To proceed:

1. Click **Advanced** (bottom left)
2. Click **Go to LumaWall (unsafe)**
3. Review permissions
4. Click **Allow**

### Checking Your Test Users

Verify test users are added:

```bash
# Go to: https://console.cloud.google.com/apis/credentials/consent
```

You should see your email listed under "Test users".

### Common Mistakes

 **Wrong Google Account**: Make sure you're authorizing with the SAME account that's added as a test user

 **Not Saved**: After adding test users, make sure you clicked "Save"

 **Wrong Project**: Verify you're in the correct Google Cloud project

## Step-by-Step: Adding Test User

### Visual Guide:

1. **Navigate to OAuth Consent Screen**
   ```
   Google Cloud Console → APIs & Services → OAuth consent screen
   ```

2. **Scroll to Test Users Section**
   - Should be near the bottom of the page
   - Shows "Test users" heading with a table

3. **Add Users**
   - Click "+ ADD USERS" button
   - Enter email addresses (one per line)
   - Click "Add"

4. **Save**
   - Click "SAVE" at the bottom of the page
   - Wait for confirmation

5. **Retry Authorization**
   - Get a new auth URL: `curl http://localhost:3001/api/calendar/auth/url`
   - Open in browser
   - Should now work!

## Verification Status

Your app's current status:
- **Publishing status**: Testing (default)
- **Verification status**: Not required for testing
- **User cap**: 100 test users

## Need More Help?

If you're still having issues:

1. **Check your test users list**:
   - Go to OAuth consent screen
   - Verify your email is in the test users list

2. **Try a different browser**:
   - Clear cookies/cache
   - Use incognito mode

3. **Check API is enabled**:
   - Go to APIs & Services → Library
   - Search "Google Calendar API"
   - Should show "API enabled"

4. **Verify credentials**:
   - Go to APIs & Services → Credentials
   - Check OAuth 2.0 Client ID exists
   - Verify redirect URI is: `http://localhost:3001/auth/google/callback`

## Quick Fix Checklist

- [ ] OAuth consent screen configured
- [ ] Your email added as test user
- [ ] Test users section saved
- [ ] Google Calendar API enabled
- [ ] Using the correct Google account for authorization
- [ ] Redirect URI matches in OAuth credentials
- [ ] Backend server is running

## After Adding Test User

Once you've added yourself as a test user, the complete flow should be:

```bash
# 1. Get auth URL
curl http://localhost:3001/api/calendar/auth/url

# 2. Copy the authUrl from response
# 3. Open in browser
# 4. Sign in with your Google account (the one added as test user)
# 5. Click "Advanced" → "Go to LumaWall (unsafe)"
# 6. Grant calendar permissions
# 7. You'll be redirected with a code parameter
# 8. Copy the code and complete authentication:

curl -X POST http://localhost:3001/api/calendar/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_CODE_HERE"}'
```

## For Development Team

If multiple people are developing:

1. Each developer needs their email added as a test user
2. Each developer needs to complete OAuth flow individually
3. Tokens are stored locally (not shared)
