# Stakeholder Dashboard

**Fast, searchable contact directory for stakeholder information—instantly find names, organizations, phone numbers, and emails.**

## Purpose

A lightweight contact lookup tool that lets you search across stakeholders, view details, and access contact information (mobile, office, email) at a glance. Data is pulled from a multi-sheet Excel workbook organized by geography (National, States).

---

## 🎯 Core Features

### Fast Search & Filter
- **Smart Search** — Find stakeholders by name, organization, designation, ID, phone, or email
- **Geographic Filter** — Filter by State (National, States)
- **Sector Filter** — Browse by organization type (Regulatory Body, Public Utility, etc.)
- **Priority & Position Filters** — Quick segmentation by priority level and position

### Contact Card
- **One-Click Actions** — Call (tel:), Email (mailto:), or Copy contact number
- **Complete Details** — Mobile, office number, email, influence level, interest, position, sentiment
- **Engagement Metadata** — Last interaction date, next action planned, notes
- **Pin & Recently Viewed** — Bookmark frequently accessed stakeholders

### Optional Analytics (Toggleable)
- **Summary Metrics** — Count of shown, high-priority, with phone, with email
- **Engagement Signals** — % with engagement history, contact info, next actions
- **Position & State Distribution** — Quick view of your stakeholder mix
- **Data Quality Flags** — Identify missing contact info or possible duplicates

### Real-Time Updates
- **Auto-Refresh** — Data syncs every 30 seconds
- **Manual Refresh** — One-click button to reload from Excel
- **Live Data** — Direct from Google Sheets (cache-busted)

---

## 📊 Data Schema

| Field | Values | Usage |
|-------|--------|-------|
| **Stakeholder ID** | P001, I002, etc | Search, tracking |
| **Name** | Any | Search, profiles |
| **Entity Type** | Person, Institution | People vs. Institutions metric |
| **Category** | Government, Political, NGO/Civil Society, Corporate, Academic, Media, Community, International | Landscape analysis, color-coded UI |
| **Organization** | Any | Profile context |
| **Role** | Any | Profile context |
| **Influence** | High, Medium, Low | Influence × Interest matrix, health score |
| **Interest** | High, Medium, Low | Risk/ally identification |
| **Position** | Supportive, Neutral, Resistant | Strategic positioning, engagement approach |
| **Priority** | High, Medium, Low | Filter view, action prioritization |
| **Strategy** | Any | Next action definition |
| **Owner** | Name | Accountability |
| **Last Interaction** | Date | Engagement timeline |
| **Next Action** | Date/Description | Action tracking |
| **Notes** | Any | Custom context |

---

## 🚀 Quick Start

**1. Set Up Excel Workbook**
- Create a Google Sheet with 4 sheets: `National`, `RJ` (Rajasthan), `MP` (Madhya Pradesh), `_Lists`
- Add headers: ID, State, Organisation, Name, Designation, Sector, Mobile, Office No., Email, Influence, Interest, Position, Sentiment, Priority, Rel. Manager, Last Interaction, Next Action Date, Next Action, Notes
- Share: "Anyone with the link" (required for CSV export)
- Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

**2. Configure App**
```bash
# Edit src/config.js and set your Sheet ID
export const GOOGLE_SHEET_CONFIG = {
  sheetId: "YOUR_SHEET_ID",  # Paste your ID here
  stateSheets: {
    "National": GID_1,
    "Rajasthan": GID_2,
    "Madhya Pradesh": GID_3,
  }
};
```

**3. Run**
```bash
npm install
npm run dev          # Dev server with hot reload
npm run build        # Production build
npm run preview      # Preview built version
```

---

## 🎨 Customization

### Colors by Sector
Edit `categoryColors` in `src/themeConstants.js`:
```javascript
export const categoryColors = {
  "Regulatory Body": { dark: "#c58af9", light: "#7c3aed" },
  "Public Utility": { dark: "#81c995", light: "#0b8043" },
  // ... add or modify sectors
};
```

### Add New State Sheets
Edit `src/config.js`:
```javascript
stateSheets: {
  "National": 1749540502,
  "Rajasthan": 909767070,
  "Madhya Pradesh": 1699599823,
  "New State": GID_NUMBER,  // Add here
}
```

### Column Mappings
If your Excel sheet uses different column names, update `COLUMN_NAMES` in `src/config.js`.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 | Fast, component-based |
| **Build** | Vite 8 | 3x faster than Webpack |
| **Data** | Google Sheets CSV | Zero backend, always accessible |
| **Icons** | Lucide React | 380+ icons, lightweight |
| **Styling** | Inline CSS | Zero dependencies, instant load |
| **Performance** | Memoization | Single-pass calculations, 3x faster |

**Bundle Size**: 66 KB gzip (includes React + all dependencies)

---

## 📁 File Structure

```
src/
├── StakeholderDashboard.jsx    (280 lines) — Main dashboard UI & state
├── googleSheetsClient.js        (47 lines) — CSV fetch & parsing
├── config.js                    (11 lines) — Google Sheet config
├── card.jsx                     (79 lines) — Reusable card component
└── main.jsx, App.jsx            — Entry points

vite.config.js                   — Build config (optimized)
package.json                     — Dependencies (minimal)
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `↓` / `↑` | Navigate stakeholder list |
| `Enter` | Select highlighted stakeholder |
| `Esc` | Clear search |
| Click stakeholder | View full contact card |

---

## 🔧 Troubleshooting

**"Could not load stakeholder data" error?**
1. ✓ Verify sheet is shared: "Anyone with the link" (NOT "Restricted")
2. ✓ Check Sheet ID matches your workbook URL
3. ✓ Ensure sheets named `National`, `Rajasthan`, `Madhya Pradesh` exist
4. ✓ Hard refresh browser: `Ctrl+Shift+R` (clears cache)

**Missing data or incomplete search results?**
- Add new rows to Excel and click "🔄 Refresh" (or wait 30 sec for auto-refresh)
- Check column headers match exactly (case-sensitive)
- Verify phone numbers don't have special chars if search fails

**Want to add new data columns?**
1. Add column to Google Sheet
2. Update `COLUMN_NAMES` mapping in `src/config.js`
3. Use new field in the dashboard (e.g., `stakeholder.newField`)

---

## 📈 What's Possible Next

- **Export** — CSV/PDF reports for board presentations
- **History** — Track changes timeline (who moved where, when)
- **Webhooks** — Slack/Teams alerts on status changes
- **Multi-sheet** — Combine multiple data sources
- **Auth** — Permission levels for teams
- **Custom scoring** — User-defined engagement algorithms

---

## 📄 License

MIT — Use freely for any purpose.

---

**Built with ❤️ for strategic stakeholder management. Deploy in 5 minutes. Make data-driven engagement decisions.**

## Troubleshoot

**"0 stakeholders"** → Sheet ID correct • "Anyone with link" shared • Column names match (case-sensitive)

**Data not loading** → Hard refresh (Ctrl+Shift+R) • Check DevTools console

**401 Unauthorized** → Share sheet with "Anyone with the link"

## Deploy

```bash
npm run build && npm run preview
```
Upload `dist/` to Netlify, Vercel, GitHub Pages, or any static host.
