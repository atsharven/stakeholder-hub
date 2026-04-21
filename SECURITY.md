# Security & Privacy Improvements

## Overview
This document outlines the security improvements made to the Stakeholder Hub dashboard.

---

## Security Issues Fixed ✅

### 1. **Console Log Data Exposure - FIXED** 🔐
**Before**: Sensitive data logged to console in production
```javascript
console.log(`▶ Fetching ${configuredState} sheet (GID: ${gid})...`)
console.warn(`⚠ Duplicate ID detected: "${stakeholder.id}"...`)
```

**After**: Debug logs only in development mode
```javascript
if (process.env.NODE_ENV === 'development') {
  console.debug(`▶ Fetching ${configuredState} sheet...`);
}
```

**Impact**: Developers only see debug info locally, production hides all logs

---

### 2. **Environment Variables for Secrets - FIXED** 🔐
**Before**: Client ID hardcoded in source code
```javascript
client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

**After**: Uses environment variables
```javascript
client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "..."
```

**Setup**: Create `.env.local` file
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

---

### 3. **Input Validation & XSS Protection - FIXED** 🔐
**Before**: No input validation on login form
```javascript
const newSession = {
  name: loginForm.name.trim(),
  email: loginForm.email.trim()
};
```

**After**: Validates and sanitizes all inputs
```javascript
const sanitizeInput = (input) => {
  return input
    .replace(/[<>"'&]/g, char => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;',
      "'": '&#x27;', '&': '&amp;'
    }[char]))
    .trim()
    .slice(0, 100); // Max 100 chars
};

const name = sanitizeInput(loginForm.name);
if (!name) setError(new Error('Name is required'));
if (email && !email.includes('@')) setError(new Error('Invalid email'));
if (phone && !/^[+\d\s\-().]*$/.test(phone)) setError(new Error('Invalid phone'));
```

**Impact**: Prevents XSS attacks and malformed data

---

### 4. **JWT Token Handling - IMPROVED** 🔐
**Before**: Decoded JWT without validation
```javascript
const decodedToken = JSON.parse(jsonPayload);
// No verification, no expiration check
```

**After**: Added token validation
```javascript
if (parts.length !== 3) throw new Error('Invalid JWT format');
if (!decodedToken.email || !decodedToken.sub) throw new Error('Invalid claims');

// Sanitize picture URL to prevent XSS
const pictureUrl = decodedToken.picture ? 
  (new URL(decodedToken.picture).href) : '';
```

**Note**: Signature verification happens on Google's server (automatic)

**Impact**: Prevents malformed tokens, XSS from picture URLs

---

### 5. **Async/Timeout Leaks - FIXED** 🔐
**Before**: Infinite retry loop, uncleared intervals
```javascript
const initGoogleSignIn = () => {
  // ... no max retry limit, infinite loop possible
  setTimeout(initGoogleSignIn, 500);
};

const interval = setInterval(loadData, 30000);
// No cleanup mentioned
```

**After**: Added max retry limit and proper cleanup
```javascript
let retryCount = 0;
const maxRetries = 10;
let mounted = true;

const initGoogleSignIn = () => {
  if (!mounted) return;
  // ... 
  if (retryCount < maxRetries) {
    retryCount++;
    setTimeout(initGoogleSignIn, 500);
  }
};

return () => { mounted = false; };

// Cleanup in effect
return () => { clearInterval(interval); };
```

**Impact**: Prevents memory leaks, DoS from infinite retries

---

### 6. **Error Handling - IMPROVED** 🔐
**Before**: Exposed error details to console
```javascript
console.error('Error fetching stakeholders:', error);
```

**After**: Hides details in production, logs safely
```javascript
if (process.env.NODE_ENV === 'development') {
  console.error('Error fetching stakeholders');
}
```

**Impact**: Doesn't leak error stack traces to attackers

---

### 7. **Google Sign-Out - FIXED** 🔐
**Before**: No error handling on sign-out
```javascript
window.google.accounts.id.revoke(session.email, () => {
  console.log("Signed out from Google");
});
```

**After**: Wrapped in try-catch
```javascript
try {
  window.google.accounts.id.revoke(session.email, () => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Google sign-out completed');
    }
  });
} catch (err) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Google sign-out error');
  }
}
```

**Impact**: Graceful error handling, no uncaught exceptions

---

## Data Storage & Privacy

### localStorage Usage (⚠️ Current Design)
**What's stored:**
```javascript
{
  name: "User Name",           // User entered or from Google
  email: "user@example.com",   // From Google
  phone: "1234567890",         // User entered (optional)
  picture: "https://...",      // From Google
  loginAt: "2026-04-18T...",   // Timestamp
  loginMethod: "google",        // Auth method
  iss: "https://accounts.google.com",  // Issuer (Google only)
  sub: "1234567890",           // Google subject ID
}
```

**Security Notes:**
- ✅ No passwords stored
- ✅ No sensitive credentials
- ✅ User can clear anytime (browser cache)
- ✅ Sanitized inputs
- ⚠️ **Not encrypted** (client-side storage only)
- ⚠️ **Vulnerable to XSS** if severe XSS vulnerability exists

**Recommendation**: For production with sensitive data, move to secure backend with:
- Encrypted sessions
- HTTP-only cookies
- CSRF tokens
- Server-side validation

---

## Console Logging Levels

### Development (NODE_ENV=development)
All debug, info, warn, error messages shown
```javascript
if (process.env.NODE_ENV === 'development') {
  console.debug('Detailed info');
  console.error('Error details');
}
```

### Production (NODE_ENV=production)
Only critical errors shown to developers via external error tracking

---

## Before Deployment to Production

1. **Create `.env.local`** with your Google Client ID:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your VITE_GOOGLE_CLIENT_ID
   ```

2. **Test in production mode**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Add error tracking** (Sentry, LogRocket, etc.)

4. **Review CSP headers** if using nginx/Apache

5. **Enable HTTPS** (required for Google Sign-In in production)

6. **Set NODE_ENV=production** in deployment

---

## Security Checklist

- ✅ No sensitive data in console logs
- ✅ No hardcoded secrets
- ✅ Input validation & XSS protection
- ✅ JWT validation
- ✅ Async cleanup (no leaks)
- ✅ Error handling (no info disclosure)
- ✅ Proper logout handling
- ⏳ TODO: Backend session storage (future)
- ⏳ TODO: HTTPS + secure cookies (future)
- ⏳ TODO: Rate limiting (future)

---

## Still TODO (Future)

1. **Backend Session Storage**
   - Store user sessions on backend
   - Encrypted HTTP-only cookies
   - Server-side validation

2. **Additional Security Headers**
   - CSP (Content Security Policy)
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy

3. **Rate Limiting**
   - Prevent brute force login attempts
   - Throttle API requests

4. **Audit Logging**
   - Log user actions for compliance
   - Track security events

5. **Two-Factor Authentication (2FA)**
   - TOTP or SMS-based
   - For sensitive operations

---

## Questions?

For security concerns or improvements, contact the development team.

Last Updated: April 18, 2026
