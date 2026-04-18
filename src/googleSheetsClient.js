import { GOOGLE_SHEET_CONFIG, COLUMN_NAMES } from './config'

const normalizeCell = (value) =>
  String(value || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .trim();

const parseCSVRows = (csvText) => {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(normalizeCell(cell));
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(normalizeCell(cell));
      const hasContent = row.some((entry) => entry !== '');
      if (hasContent) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(normalizeCell(cell));
    if (row.some((entry) => entry !== '')) rows.push(row);
  }

  return rows;
};

const parseCSV = (csvText) => {
  const rowsData = parseCSVRows(csvText);
  if (rowsData.length < 2) throw new Error('Empty data');

  const headers = rowsData[0].map(normalizeCell);
  const rows = [];
  let skipped = 0;

  for (let i = 1; i < rowsData.length; i++) {
    const cells = rowsData[i];
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = normalizeCell(cells[idx] || '');
    });

    // Validation: Skip rows with empty ID (primary key)
    const id = row[COLUMN_NAMES.id]?.trim();
    if (!id) {
      skipped++;
      continue;
    }

    // Only add if has at least one non-empty value (already has valid ID)
    if (Object.values(row).some(v => v && v.trim())) rows.push(row);
  }

  if (skipped > 0) console.log(`  ⚠ Skipped ${skipped} rows with missing ID`);

  return rows;
};

const normalizeTextValue = (value) => normalizeCell(value).replace(/\s+/g, ' ');

const mapRow = (row, rowIndex, sheetState) => {
  // Keep state as-is from config (no normalization)
  // State value from sheet is used for validation, but we use configured state name
  const stateValue = normalizeTextValue(row[COLUMN_NAMES.state] || '');
  
  // Sanitize state: if it's not a valid configured state name, use the configured state
  const validStates = GOOGLE_SHEET_CONFIG.getAllStateNames();
  const isMalformed = !stateValue || stateValue.includes(',') || stateValue.length > 50;
  const finalState = (stateValue && validStates.includes(stateValue) && !isMalformed) 
    ? stateValue 
    : (sheetState || 'Unknown');
  
  return {
    id: normalizeTextValue(row[COLUMN_NAMES.id] || ''),
    state: finalState,
    name: normalizeTextValue(row[COLUMN_NAMES.name] || ''),
    organization: normalizeTextValue(row[COLUMN_NAMES.organization] || ''),
    designation: normalizeTextValue(row[COLUMN_NAMES.designation] || ''),
    category: normalizeTextValue(row[COLUMN_NAMES.category] || ''), // Sector (org type like Regulatory Body, Public Utility)
    mobile: normalizeTextValue(row[COLUMN_NAMES.mobile] || ''),
    officeNo: normalizeTextValue(row[COLUMN_NAMES.officeNo] || ''),
    email: normalizeTextValue(row[COLUMN_NAMES.email] || '').toLowerCase(),
    influence: normalizeTextValue(row[COLUMN_NAMES.influence] || ''),
    interest: normalizeTextValue(row[COLUMN_NAMES.interest] || ''),
    position: normalizeTextValue(row[COLUMN_NAMES.position] || ''),
    sentiment: normalizeTextValue(row[COLUMN_NAMES.sentiment] || ''),
    priority: normalizeTextValue(row[COLUMN_NAMES.priority] || ''),
    relManager: normalizeTextValue(row[COLUMN_NAMES.relManager] || ''),
    lastInteraction: normalizeTextValue(row[COLUMN_NAMES.lastInteraction] || ''),
    nextActionDate: normalizeTextValue(row[COLUMN_NAMES.nextActionDate] || ''),
    nextAction: normalizeTextValue(row[COLUMN_NAMES.nextAction] || ''),
    notes: normalizeTextValue(row[COLUMN_NAMES.notes] || ''),
    
    // Derived/formatted fields for dashboard compatibility
    phone: normalizeTextValue(row[COLUMN_NAMES.mobile] || ''), // Primary contact number
    contact: [row[COLUMN_NAMES.mobile], row[COLUMN_NAMES.officeNo]].map(normalizeTextValue).filter(Boolean).join(' / '), // Both phone numbers
    entityType: 'Person', // Default to Person (can be enhanced in future)
    strategy: '', // Not in new schema but may be needed
    owner: normalizeTextValue(row[COLUMN_NAMES.relManager] || ''), // Map relManager to owner for compatibility
  };
};

// Fetch a single sheet by GID and parse it
const fetchSheetByGid = async (gid) => {
  const baseUrl = GOOGLE_SHEET_CONFIG.getCsvUrl();
  const csvUrl = `${baseUrl}&gid=${gid}&t=${Date.now()}`;
  
  // Get the configured state name for this GID
  const configuredState = GOOGLE_SHEET_CONFIG.getStateFromGid(gid);
  
  try {
    console.log(`▶ Fetching ${configuredState} sheet (GID: ${gid})...`);
    const response = await fetch(csvUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Failed to fetch sheet GID ${gid}`);
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    console.log(`✓ ${configuredState}: Parsed ${rows.length} valid records`);
    
    return rows.map((row, idx) => mapRow(row, idx, configuredState));
  } catch (error) {
    console.error(`✗ ${configuredState} fetch error:`, error.message);
    return [];
  }
};

// Fetch ALL state sheets and combine them
export const fetchStakeholders = async () => {
  const sheetGids = GOOGLE_SHEET_CONFIG.getAllStateGids();
  
  if (sheetGids.length === 0) {
    throw new Error('No state sheets configured. Please add sheets to GOOGLE_SHEET_CONFIG.stateSheets');
  }
  
  try {
    console.log(`=== STAKEHOLDER DATA LOAD ===`);
    console.log(`Loading ${sheetGids.length} state sheet(s)...`);
    
    // Fetch all sheets in parallel
    const allSheetPromises = sheetGids.map(gid => fetchSheetByGid(gid));
    
    const allSheetResults = await Promise.all(allSheetPromises);
    
    // Combine all stakeholders from all sheets
    const allStakeholders = allSheetResults.flat();
    
    if (allStakeholders.length === 0) {
      throw new Error('No data found across all sheets');
    }
    
    // Log summary with state breakdown
    console.log(`\n✅ Load Complete:`);
    console.log(`  Total: ${allStakeholders.length} stakeholders`);
    GOOGLE_SHEET_CONFIG.getAllStateNames().forEach(state => {
      const count = allStakeholders.filter(s => s.state === state).length;
      console.log(`  • ${state}: ${count}`);
    });
    
    return allStakeholders;
  } catch (error) {
    console.error('Error fetching stakeholders:', error);
    throw error;
  }
};
