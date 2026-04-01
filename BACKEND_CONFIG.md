# Backend Configuration Guide

## Current Setup: Google Sheets ✅

The application now uses **Google Sheets** as the backend database.

### Google Sheet Details
- **Sheet ID**: `1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI`
- **Sheet URL**: https://docs.google.com/spreadsheets/d/1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI/edit

### How It Works
1. **Read Operations** (✅ Working)
   - Fetches data from the Google Sheet using CSV export (public access, no auth needed)
   - Parses CSV into application format
   - Data loads on app startup

2. **Write Operations** (⚠️ Local-only for now)
   - Changes are applied to local state only
   - For persistent writes to Google Sheets, you need to set up Google Cloud credentials
   - See "Enabling Writes" section below

### Column Mapping
The app expects these columns in the Google Sheet:
- `Stakeholder Name`
- `Category`
- `Organization`
- `Role in Ecosystem`
- `Influence`
- `Interest`
- `Position`
- `Engagement Strategy`
- `Owner`
- `Recent Developments`
- `Engagement History`
- `Opportunity Window`
- `Last Interaction Date`
- `Next Action`
- `Priority`

---

## Enabling Persistent Writes (Optional)

To enable ADD/EDIT/DELETE operations to sync back to the Google Sheet:

### Step 1: Set up Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**
4. Create a **Service Account**
5. Download the JSON credentials file

### Step 2: Update googleSheetsClient.js
Replace the current implementation with authenticated API calls using the service account credentials.

### Step 3: Share the Sheet
Share your Google Sheet with the service account email (found in the JSON credentials file)

---

## Switching Back to Supabase

All Supabase code is **commented out** in `StakeholderDashboard.jsx`. To revert:

1. Uncomment the Supabase import:
   ```javascript
   import { supabase } from './supabaseClient'
   ```

2. Replace the Google Sheets imports with Supabase handling

3. Revert the `handleSave` and `handleDelete` functions to use Supabase API calls

See the comments in `StakeholderDashboard.jsx` for the original Supabase code.

---

## File Structure
- `googleSheetsClient.js` - Google Sheets API client (CSV export for reads)
- `supabaseClient.js` - Supabase client (currently unused but available)
- `StakeholderDashboard.jsx` - Main app component (using Google Sheets)

---

## Current Limitations
✅ = Works
❌ = Requires Auth Setup

| Operation | Status | Notes |
|-----------|--------|-------|
| **Read all stakeholders** | ✅ | Uses public CSV export |
| **Add stakeholder** | ⚠️ Local only | Requires Google Cloud auth for persistence |
| **Edit stakeholder** | ⚠️ Local only | Requires Google Cloud auth for persistence |
| **Delete stakeholder** | ⚠️ Local only | Requires Google Cloud auth for persistence |
| **Real-time sync** | ❌ | Would need Webhook or polling setup |

---

## Troubleshooting

### CSV not loading?
- Check that the Google Sheet is shareable/public
- Verify the Sheet ID is correct
- Check browser console for CORS errors

### Want to use Google Sheets with writes?
- Follow the "Enabling Persistent Writes" section above
- Use the `google-spreadsheet` library (already installed) with service account credentials

---

Generated: 2026-04-02
