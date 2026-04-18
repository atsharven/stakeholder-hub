# Project Memory

## Purpose

This project is a stakeholder dashboard used to search stakeholders, view profiles, and quickly access contact details such as mobile number, office number, and email.

The backend data source is an Excel/Google Sheets workbook. Contact details are the primary operational need. Other columns support stakeholder analysis and prioritization.

## Data Source

Google Sheets document:
`https://docs.google.com/spreadsheets/d/1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI/edit`

Configured sheet ID in code:
`1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI`

## Workbook Structure

The workbook is divided into 4 sheets:

1. `National`
   Stores national contacts that are not tied to a specific state.
2. `RJ`
   Stores Rajasthan contacts.
3. `MP`
   Stores Madhya Pradesh contacts.
4. `_Lists`
   Stores dropdown/menu options for controlled fields:
   `State`, `Sector`, `Influence Level`, `Interest Level`, `Position`, `Sentiment`, `Priority`

## Current Column Schema

Expected columns:

- `ID`
- `State`
- `Organisation`
- `Name`
- `Designation`
- `Sector`
- `Mobile`
- `Office No.`
- `Email`
- `Influence`
- `Interest`
- `Position`
- `Sentiment`
- `Priority`
- `Rel. Manager`
- `Last Interaction`
- `Next Action Date`
- `Next Action`
- `Notes`

Example rows shared by user:

- `RJ-01 | Rajasthan | RERC | Dr. Rajesh Sharma | Chairman | Regulatory Body |  | 0141-2742337 | secyrerc@rajasthan.gov.in`
- `RJ-02 | Rajasthan | RERC | Sh. Mukul Gaur | PS to Chairman RERC | Regulatory Body | 9529326899`
- `RJ-03 | Rajasthan | RERC | Sh. Himanshu Khurana | Director (Tech.) | Regulatory Body | 9829500490 | 0141-2742473 | rercjpr@yahoo.co.in`

## App Architecture

- `src/main.jsx`
  React entry point.
- `src/StakeholderDashboard.jsx`
  Main UI and most dashboard logic.
- `src/googleSheetsClient.js`
  Fetches CSV exports from Google Sheets, parses rows, and maps them into dashboard objects.
- `src/config.js`
  Stores sheet ID, state sheet config, and column mappings.
- `src/theme.jsx`
  Theme provider plus palette definitions.

## Important Code Reality

The current app is already adapted around state-based sheets and this schema.

Notable implementation detail:
- `src/config.js` currently maps human-readable state names to GIDs:
  - `National`
  - `Rajasthan`
  - `Madhya Pradesh`

This means the app expects the displayed state values, even if workbook tab names are abbreviated like `RJ` and `MP`.

## Known Issues Discovered

1. Lint errors exist in `src/StakeholderDashboard.jsx`
   - `relationshipColors` is referenced but not imported.
   - `getRelColor` is defined but unused.
2. Lint errors exist in `src/theme.jsx`
   - `react-refresh/only-export-components` complains because theme constants and React components/hooks are exported from the same file.
3. Build validation from this environment is inconclusive
   - `npm run build` hit a Windows sandbox `spawn EPERM` while Vite loaded config, so build health could not be fully confirmed here.

## Working Assumptions

- The dashboard's primary job is stakeholder lookup and contact retrieval.
- Analytics are useful, but secondary to fast search and profile access.
- The Google Sheet is the canonical source of truth.
- We should preserve support for multiple state sheets plus national records.

## Next Fix Areas

- Align config comments and behavior with the real workbook structure (`National`, `RJ`, `MP`, `_Lists`).
- Clean up current lint issues.
- Check whether search/profile flows prioritize contact access well enough.
- Verify whether workbook tab names and configured GIDs still match the live sheet setup.

## UI Revamp Direction

Current preferred direction:

- Keep the revamp light on code and avoid large architectural changes.
- Preserve the existing Google Sheets fetch flow and overall single-page app structure.
- Shift the product from analytics-first to search-and-contact-first.
- Keep enough UI/UX improvement to feel modern, but avoid adding many new components or dependencies.
- Avoid giving one stakeholder default visual prominence on page load.

Preferred UX priorities:

1. Fast stakeholder search
2. Clear browsing by filters
3. Strong contact card
4. Secondary, quieter analytics

Recommended revamp shape:

- A simple top header with title, search, and key actions.
- A compact filter row for `State`, `Sector`, `Priority`, and `Position`.
- A cleaner results area that feels like a contacts workspace rather than a metrics dashboard.
- A prominent stakeholder profile/contact card with fast actions like call, email, and copy.
- Analytics either collapsed, reduced, or moved below the primary search/contact workflow.

Constraint:

- Favor minimal code edits and incremental UI changes over a ground-up rewrite.

## Implemented Revamp Notes

The first-pass UI revamp has been implemented with minimal architectural change.

Current UI shape:

- Search-first hero header
- Compact filter bar
- Left-side stakeholder results list
- Right-side sticky contact card
- Reduced analytics to lightweight summary counters
- Optional metrics and insights toggles instead of always-on dashboard blocks

Notable behavior:

- Search now matches name, organisation, designation, ID, state, sector, phone, and email.
- Search matches are visually highlighted in the results list.
- Results auto-sort with higher priority contacts first, then by name.
- Results also use query-aware ranking for more relevant search ordering.
- Selecting a stakeholder opens a contact-focused detail panel.
- No stakeholder is auto-selected by default after load/filtering if the prior selection is gone.
- Contact card supports call, email, and copy actions where data exists.
- Users can pin important stakeholders for quick access.
- Recently opened stakeholders are surfaced automatically.
- Result rows are denser and show phone, email, relationship manager, and next action metadata.
- Missing phone and email values are explicitly flagged in results.
- Entry-screen copy is intentionally shorter and now branded as `WRI Stakeholder Dashboard`.
- Metrics such as shown/high-priority/with-phone/with-email are optional.
- Insights like engagement coverage and simple charts are optional.

Persistence behavior:

- Pins and recent views are stored in localStorage.
- This is client-side only and does not write back to the sheet.

## Data Reliability Notes

Google Sheets parsing has been hardened beyond the original implementation.

Current parser behavior:

- Handles quoted commas correctly.
- Handles CRLF line endings.
- Handles quoted multi-line fields more safely than the earlier line-split parser.
- Normalizes BOM and trims cell values.
- Normalizes repeated whitespace in mapped fields.
- Lowercases email values for more consistent search matching.

Search behavior is now more reliable:

- Search uses normalized text matching.
- Phone search strips non-digit characters before matching.
- Phone matching no longer incorrectly matches every row for non-phone queries.
- Result ordering is query-aware and prioritizes stronger matches before falling back to priority and name sorting.

## Login Shell Notes

A lightweight login screen shell now exists before the dashboard.

Current behavior:

- User enters name and optionally phone/email.
- Session is stored locally in browser storage.
- Login is currently front-end only and acts as a workspace gate.
- This is intentionally a placeholder foundation for future user-detail storage and possible permissions.

Not yet implemented:

- Real authentication
- Backend user persistence
- Role-based access
- Audit/activity tracking

## Interaction Notes

Current keyboard behavior:

- `ArrowDown` and `ArrowUp` move through search results.
- `Enter` selects the highlighted stakeholder.
- `Escape` clears the current search.

Current responsive behavior:

- The desktop view uses a two-column results and contact-card layout.
- On smaller screens, the contact card moves above the list and loses sticky positioning.
- The layout remains within the current single-page architecture and inline-style approach.

## Product Hierarchy Notes

The current intended hierarchy is:

1. Search
2. Filters
3. Results list
4. Contact card
5. Optional metrics and insights

This should remain the default unless the user explicitly wants a more analytics-led experience.

## Optional Insights and Quality Signals

Optional insights currently include:

- Engagement coverage
- Notes coverage
- Next-action coverage
- Position mix mini chart
- State spread mini chart

Data quality signals currently include:

- Missing both phone and email
- Possible duplicate identity rows
- Repeated phone numbers
- Repeated email addresses

These are intentionally secondary and should stay optional rather than dominating the default workspace.

Implementation approach:

- Kept the existing single-page React structure.
- Kept the existing Google Sheets fetch and mapping flow.
- Replaced heavier dashboard sections rather than introducing many new components.
