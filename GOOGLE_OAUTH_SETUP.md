# Google OAuth Setup Guide

## Overview
This guide will help you set up Google Sign-In for the YUVIC e-commerce application.

## Prerequisites
- Google Cloud Platform account
- Project with backend and frontend running

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in required fields:
     - App name: **YUVIC**
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip scopes (click **Save and Continue**)
   - Add test users if needed
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **YUVIC Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:4200`
     - `http://localhost:5000`
     - Add your production domain when ready
   - Authorized redirect URIs:
     - `http://localhost:4200`
     - Add your production domain when ready
   - Click **Create**

5. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

## Step 4: Configure Frontend

1. Open `src/environments/environment.ts`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID:

```typescript
googleClientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
```

3. Also update `src/environments/environment.development.ts` if it exists

## Step 5: Database Migration

The `google_id` field has been added to the User model. Run the following SQL to add it to your database:

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
```

Or let Sequelize auto-sync by restarting the backend server (if sync is enabled).

## Step 6: Test the Integration

1. Start the backend server:
```bash
cd backend/auth-service
node server.js
```

2. Start the frontend:
```bash
ng serve
```

3. Navigate to `http://localhost:4200/authentication/signin`
4. You should see a "Sign in with Google" button
5. Click it and sign in with your Google account

## How It Works

### Frontend Flow
1. User clicks "Sign in with Google" button
2. Google OAuth popup appears
3. User authenticates with Google
4. Google returns a JWT credential
5. Frontend sends credential to backend `/api/auth/google-signin`
6. Backend validates and creates/updates user
7. Backend returns JWT token
8. User is logged in

### Backend Flow
1. Receives Google JWT credential
2. Decodes the JWT to get user info (email, name, picture, Google ID)
3. Checks if user exists by email
4. If new user:
   - Creates user with Google info
   - Sets Google ID as password (hashed)
   - Assigns customer role
5. If existing user:
   - Updates profile image if not set
   - Stores Google ID if not already stored
6. Generates application JWT token
7. Returns token and user data

## Security Notes

1. **Never commit your Google Client ID to public repositories**
2. Use environment variables for production
3. The Google ID is stored as a hashed password for users who sign up via Google
4. Users who sign up with Google cannot use password login unless they set a password separately

## Troubleshooting

### "Invalid Client ID" Error
- Verify the Client ID in environment.ts matches your Google Cloud Console
- Check that JavaScript origins are correctly configured

### "Redirect URI Mismatch" Error
- Ensure redirect URIs in Google Cloud Console match your application URL
- Include both `http://localhost:4200` and your production domain

### Google Button Not Appearing
- Check browser console for errors
- Verify Google Sign-In script is loaded in index.html
- Ensure `google` object is available in the component

### Backend Errors
- Check that `google_id` column exists in users table
- Verify JWT_SECRET is set in backend environment
- Check backend logs for detailed error messages

## Production Deployment

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`

2. Update environment.prod.ts with production Client ID

3. Ensure HTTPS is enabled (required by Google OAuth)

4. Test thoroughly before going live

## Additional Features to Implement

- [ ] Link Google account to existing email/password account
- [ ] Allow users to disconnect Google account
- [ ] Add Facebook OAuth
- [ ] Add Apple Sign-In
- [ ] Implement account linking UI
- [ ] Add profile picture sync from Google

## Support

For issues or questions:
- Check Google OAuth documentation: https://developers.google.com/identity/gsi/web
- Review backend logs
- Check browser console for frontend errors
