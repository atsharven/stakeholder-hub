# 🚀 Stakeholder Hub - Setup Guide

## Quick Start (3 Steps)

### 1️⃣ Create Google Sheet with Data

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. **Copy the CSV template** from the file: `STAKEHOLDER_DATA_TEMPLATE.csv`
4. Paste all content into the first row and below
5. **Share the sheet**: Click "Share" → Choose "Anyone with the link" → Copy link

### 2️⃣ Update Sheet ID in Config

1. Open your shared Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/**SHEET_ID_HERE**/edit`
3. Open `src/config.js` and update:
   ```javascript
   sheetId: "YOUR_SHEET_ID_HERE",
   ```

### 3️⃣ Run the Dashboard

```bash
npm run dev
```

Visit `http://localhost:5176/` and you should see all your data! 🎉

---

## Column Names (MUST Match Exactly)

These are the exact column headers your Google Sheet needs:

```
Stakeholder Name
Category
Organization
Role in Ecosystem
Influence
Interest
Position
Engagement Strategy
Owner
Recent Developments
Engagement History
Opportunity Window
Last Interaction Date
Next Action
Priority
```

⚠️ **Important**: Column names must match **exactly** (case-sensitive)

---

## Valid Values

Use these exact values in your cells:

**Influence, Interest, Priority:**
- `High`
- `Medium`
- `Low`

**Position:**
- `Supportive`
- `Neutral`
- `Resistant`

**Category:**
- `Government`
- `Political`
- `NGO/Civil Society`
- `Corporate`
- `Academic`
- `Media`
- `Community`
- `International`

**Engagement Strategy:**
- `Engage (Manage closely)`
- `Consult (Keep satisfied)`
- `Keep Informed`
- `Monitor`

---

## Troubleshooting

### Dashboard shows "0 stakeholders"?

**Check the browser console** (F12 → Console tab):
- Look for error messages in red
- Common issues:
  1. Sheet ID is wrong → Check `config.js`
  2. Sheet is not publicly shared → Share with "Anyone with the link"
  3. Column names don't match → Check spelling/capitalization exactly
  4. Google Sheet is empty → Copy data from `STAKEHOLDER_DATA_TEMPLATE.csv`

### Can't see my data after editing Google Sheet?

- Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Google Sheets can take 10-30 seconds to export the CSV

---

## File Structure

```
src/
├── config.js ........................ All configuration & secrets (EDIT THIS)
├── googleSheetsClient.js ........... Fetches data from Google Sheet
├── StakeholderDashboard.jsx ........ Main dashboard component
├── App.jsx ......................... Entry point
└── main.jsx

STAKEHOLDER_DATA_TEMPLATE.csv ....... Copy this data format into your sheet
```

---

## Adding New Columns

Once dashboard works, you can add more columns to Google Sheet!

When you add a new column:
1. Add a new row in `config.js` `COLUMN_NAMES` object
2. The dashboard automatically picks it up
3. Update `googleSheetsClient.js` to use the new field

Example - Adding "Days Since Contact":
```javascript
// In config.js
export const COLUMN_NAMES = {
  // ... existing columns
  daysSinceContact: "Days Since Contact",
};

// In googleSheetsClient.js
daysSinceContact: row[COLUMN_NAMES.daysSinceContact] || '',
```

---

## Example Sheet Structure

| Stakeholder Name | Category | Organization | Role in Ecosystem | Influence | Interest | Position | Engagement Strategy | Owner | Recent Developments | Engagement History | Opportunity Window | Last Interaction Date | Next Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ministry of Finance | Government | Federal Government | Policy Regulator | High | High | Supportive | Engage (Manage closely) | Priya Sharma | Budget announced | 3 meetings in 2024 | March 2025 | 2024-12-10 | Present report | High |
| Your Stakeholder | Your Category | Your Org | Your Role | High/Medium/Low | High/Medium/Low | Supportive/Neutral/Resistant | Strategy | Owner Name | Recent news | Past interactions | Future window | YYYY-MM-DD | Next step | Priority |

---

## Dashboard Features

✅ **Overview Metrics** - Total, Priority, Position counts  
✅ **Influence/Interest Matrix** - 3×3 visualization  
✅ **Category Breakdown** - Stakeholders per category  
✅ **Priority Distribution** - High/Medium/Low breakdown  
✅ **Individual Cards** - Each stakeholder profile with gauges  
✅ **Recent Interactions** - Last 5 contacts  
✅ **Upcoming Actions** - Next 5 priorities  

---

## Config File Example

```javascript
// src/config.js

export const GOOGLE_SHEET_CONFIG = {
  sheetId: "1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI", // ← UPDATE THIS
  getCsvUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`;
  }
};

export const COLUMN_NAMES = {
  name: "Stakeholder Name",
  category: "Category",
  organization: "Organization",
  // ... matches your Google Sheet exactly
};
```

---

## Need Help?

Check the browser console for detailed logs:
- `🔄 Fetching from Google Sheet...`
- `📋 CSV Headers found: [...]`
- `✅ Successfully loaded X stakeholders`
- `❌ Error fetching stakeholders` (and why)

---

**Happy tracking! 🚀**
