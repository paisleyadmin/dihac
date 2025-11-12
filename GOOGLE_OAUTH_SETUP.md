# Google OAuth Setup Guide

## Overview
I've implemented Google OAuth sign-in functionality. The code is ready, but you need to set up Google OAuth credentials to make it work.

## What's Been Implemented

### Frontend (`frontend/src/components/LoginModal.js`)
- ✅ Replaced the placeholder button with the actual `GoogleLogin` component
- ✅ Implemented `handleGoogleLogin` to send credentials to backend
- ✅ Error handling for failed OAuth attempts

### Backend (`backend/services/user-service/main.py`)
- ✅ OAuth endpoint: `POST /api/oauth/google`
- ✅ Token verification using Google's official library
- ✅ Automatic user creation for new Google accounts
- ✅ JWT token generation for authenticated users

### Configuration
- ✅ `GoogleOAuthProvider` already wraps the app in `index.js`
- ✅ Environment variables configured in `.env` files
- ✅ Docker compose updated to pass OAuth credentials

## What You Need To Do

### Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: **DIHAC Legal Assistant**
   - User support email: Your email
   - Developer contact: Your email
5. For Application type, select **"Web application"**
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost` (if needed)
7. Add authorized redirect URIs (not strictly needed for this flow, but good practice):
   - `http://localhost:3000`
8. Click **Create**
9. Copy the **Client ID** (it looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### Step 2: Configure Environment Variables

#### Frontend Environment
Edit `frontend/.env` and replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID:

```bash
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

#### Backend Environment
Edit `.env` (root directory) and replace `YOUR_GOOGLE_CLIENT_ID` with the same Client ID:

```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

**Important:** The frontend and backend must use the SAME Google Client ID.

### Step 3: Restart the Application

If using Docker:
```bash
docker-compose down
docker-compose up -d
```

If running services manually:
```bash
# Restart frontend (Ctrl+C in the terminal running npm start, then):
cd frontend
npm start

# Restart user-service (Ctrl+C in the terminal, then):
cd backend/services/user-service
python main.py
```

### Step 4: Test Google Sign-In

1. Open the application at `http://localhost:3000`
2. Click the **"Continue with Google"** button
3. You should see Google's OAuth popup
4. Select your Google account
5. You should be logged in automatically

## Troubleshooting

### "Invalid Client" Error
- Make sure the Client ID in both `.env` files matches exactly
- Check that you added `http://localhost:3000` to authorized origins in Google Console
- Clear browser cache and try again

### OAuth Popup Blocked
- Make sure your browser allows popups from localhost
- Try disabling popup blockers for localhost

### "Google login failed" Error
- Check browser console for detailed error messages
- Verify the backend is running and accessible at `http://localhost:8000`
- Check Docker logs: `docker logs dihac-user-service`

### User Already Exists
- Google OAuth will automatically log in existing users with matching email addresses
- If you previously registered with email/password, Google OAuth will use that same account

## How It Works

1. User clicks "Continue with Google"
2. Google's OAuth popup appears
3. User selects their Google account
4. Google returns a credential token
5. Frontend sends the token to `POST /api/oauth/google`
6. Backend verifies the token with Google's servers
7. Backend creates a new user (if needed) or finds existing user
8. Backend returns a JWT token
9. User is logged in

## Security Notes

- The Client ID is safe to expose in the frontend (it's not a secret)
- The actual authentication happens on Google's servers
- Backend verifies every token with Google before trusting it
- Users created via OAuth get a random password (they can't use password login)
- All passwords are hashed with bcrypt
- JWT tokens expire after 24 hours (configurable)

## Facebook OAuth (Optional)

The code also supports Facebook OAuth, but it's not configured yet. If you want to enable it:

1. Create a Facebook App at https://developers.facebook.com/apps/
2. Get the App ID and App Secret
3. Add them to `.env`:
   ```bash
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```
4. The frontend already has the button, but you'll need to implement the Facebook SDK integration (similar to Google)
