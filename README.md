# Stakeholder Engagement Dashboard

Analytics dashboard for tracking stakeholder influence, interest, and engagement. React + Vite + Google Sheets.

## Quick Start

**1. Google Sheet Setup**
- Create [Google Sheet](https://sheets.google.com)
- Add columns from `STAKEHOLDER_DATA_TEMPLATE.csv`
- Share: "Anyone with the link" (required)
- Copy Sheet ID from URL

**2. Update Config**
```bash
# src/config.js → sheetId: "YOUR_SHEET_ID"
```

**3. Run**
```bash
npm install && npm run dev
```

## Columns

**Required**: Stakeholder Name • Category • Influence • Interest • Position • Priority

**Values**: Influence/Interest/Priority (High, Medium, Low) • Position (Supportive, Neutral, Resistant) • Category (Government, Political, NGO/Civil Society, Corporate, Academic, Media, Community, International)

## Features

**Metrics**: Health Score • Engagement Index • Influence/Interest Matrix • Risk Assessment • Key Allies • People vs Institutions • Policy vs Implementation • Action Tracker • Satisfaction Index

**Filters**: All • High Influence • Resistant • High Priority

**Cards**: Top 6 stakeholders with influence/interest badges, next actions, categories

## Tech

**Flow**: Google Sheets CSV → Parser → React → Dashboard

**Files**: StakeholderDashboard.jsx (280 lines) • googleSheetsClient.js (47 lines) • config.js (11 lines)

**Stack**: React 19 • Vite 8 • Lucide • Inline CSS

## Customize

**Colors**: Edit `theme` object (StakeholderDashboard.jsx:7)  
**Filters**: Modify `filteredData` logic (line ~32)  
**Metrics**: Add useMemo hooks (follow pattern, line ~90+)

## Troubleshoot

**"0 stakeholders"** → Sheet ID correct • "Anyone with link" shared • Column names match (case-sensitive)

**Data not loading** → Hard refresh (Ctrl+Shift+R) • Check DevTools console

**401 Unauthorized** → Share sheet with "Anyone with the link"

## Deploy

```bash
npm run build && npm run preview
```
Upload `dist/` to Netlify, Vercel, GitHub Pages, or any static host.
