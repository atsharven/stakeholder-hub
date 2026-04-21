# Stakeholder Hub WRI

Fast stakeholder contact lookup built with React and Vite.

## What it does

- Search stakeholders by name, organisation, designation, phone, or email
- Filter by state, sector, and priority
- Open a contact modal with call and email actions
- Optionally sign in to save dashboard views in local storage
- Load live data from Google Sheets CSV exports

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Configuration

The app reads stakeholder data from Google Sheets using values in `src/config.js`.

Optional Google sign-in client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Copy `.env.example` to `.env.local` or update your local `.env` as needed.

## Project structure

```text
src/
  components/
    ContactModal.jsx
    DashboardControls.jsx
    DashboardHeaderSection.jsx
    FiltersSection.jsx
    InsightsSection.jsx
    ResultsSection.jsx
  config.js
  googleSheetsClient.js
  StakeholderDashboard.jsx
  theme.jsx
  themeConstants.js
  themeContext.js
  main.jsx
```

## Notes

- Guest mode works without sign-in.
- Saved dashboard views are stored locally in the browser.
- `dist/` is build output and is not tracked.
