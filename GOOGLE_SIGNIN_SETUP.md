# Google Sign-In Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add Authorized Redirect URIs:
   - **For local dev**: `http://localhost:5173`
   - **For production**: `https://yourdomain.com`
7. Copy your **Client ID**

### Step 2: Add Client ID to Code

Replace this line in `src/StakeholderDashboard.jsx` (around line 195):

```javascript
client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
```

With your actual Client ID:

```javascript
client_id: "1234567890-abcdef1234567890abcdef1234567890.apps.googleusercontent.com",
```

### Step 3: Test It Out

```bash
npm run dev
```

Visit `http://localhost:5173` and you should see the Google Sign-In button!

---

## What Happens When You Sign In?

### Google Sign-In Flow:
1. User clicks **Google Sign-In** button
2. Google popup appears
3. User authenticates with their Google account
4. App receives JWT token with user info (name, email, picture)
5. Token is decoded and user session is created
6. User is logged in ✅

### Manual Login Flow:
1. Click **"Use manual login instead"**
2. Fill in Name, Phone (optional), Email (optional)
3. Click **"Open Dashboard"**
4. User is logged in ✅

### Logout:
1. Click **logout** button in dashboard
2. Session is cleared
3. Google sign-out is triggered (if using Google)
4. Back to login screen ✅

---

## Where User Data is Stored

- **Browser localStorage**: All session data (name, email, login method, timestamp)
- **NOT sent to any server**: This is client-only for now
- **Clears on**: Browser cache clear, or manual logout

---

## Data Captured from Google

- ✅ **Name** - User's display name
- ✅ **Email** - User's email address
- ✅ **Picture** - User's profile picture (stored but not displayed yet)

No other personal data is captured.

---

## Troubleshooting

### Google button doesn't appear?
- Check that Client ID is correct
- Check browser console for errors
- Make sure you're on `http://localhost:5173` (matches authorized URI)
- Hard refresh the page (Ctrl+F5)

### "Invalid Client ID" error?
- Verify Client ID format: `XXXX.apps.googleusercontent.com`
- Check Google Cloud Console that URI is authorized
- Make sure you copied the entire Client ID

### Still having issues?
- Check browser **DevTools Console** for error messages
- Verify Google+ API is **enabled** in Cloud Console
- Try clearing browser cache and reload

---

## Future Enhancements

When ready, you can:
1. Add backend to store login sessions securely
2. Add more social logins (Facebook, GitHub)
3. Add session expiration (refresh tokens)
4. Add user preferences and settings
5. Add activity logging

For now, this gives you a **production-ready Google Sign-In** ✅

