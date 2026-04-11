import { GOOGLE_SHEET_CONFIG, COLUMN_NAMES } from './config'

// CSV line parser - handles quoted fields with commas
const parseCSVLine = (line) => {
  const cells = [];
  let current = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
};

const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  if (lines.length < 2) throw new Error('Empty data');
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cells = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => row[h] = cells[idx] || '');
    
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

const mapRow = (row, rowIndex, sheetState) => {
  // Keep state as-is from config (no normalization)
  // State value from sheet is used for validation, but we use configured state name
  const stateValue = row[COLUMN_NAMES.state] || '';
  
  // Sanitize state: if it's not a valid configured state name, use the configured state
  const validStates = GOOGLE_SHEET_CONFIG.getAllStateNames();
  const isMalformed = !stateValue || stateValue.includes(',') || stateValue.length > 50;
  const finalState = (stateValue && validStates.includes(stateValue) && !isMalformed) 
    ? stateValue 
    : (sheetState || 'Unknown');
  
  return {
    id: row[COLUMN_NAMES.id] || '',
    state: finalState,
    name: row[COLUMN_NAMES.name] || '',
    organization: row[COLUMN_NAMES.organization] || '',
    designation: row[COLUMN_NAMES.designation] || '',
    category: row[COLUMN_NAMES.category] || '', // Sector (org type like Regulatory Body, Public Utility)
    mobile: row[COLUMN_NAMES.mobile] || '',
    officeNo: row[COLUMN_NAMES.officeNo] || '',
    email: row[COLUMN_NAMES.email] || '',
    influence: row[COLUMN_NAMES.influence] || '',
    interest: row[COLUMN_NAMES.interest] || '',
    position: row[COLUMN_NAMES.position] || '',
    sentiment: row[COLUMN_NAMES.sentiment] || '',
    priority: row[COLUMN_NAMES.priority] || '',
    relManager: row[COLUMN_NAMES.relManager] || '',
    lastInteraction: row[COLUMN_NAMES.lastInteraction] || '',
    nextActionDate: row[COLUMN_NAMES.nextActionDate] || '',
    nextAction: row[COLUMN_NAMES.nextAction] || '',
    notes: row[COLUMN_NAMES.notes] || '',
    
    // Derived/formatted fields for dashboard compatibility
    phone: row[COLUMN_NAMES.mobile] || '', // Primary contact number
    contact: [row[COLUMN_NAMES.mobile], row[COLUMN_NAMES.officeNo]].filter(Boolean).join(' / '), // Both phone numbers
    entityType: 'Person', // Default to Person (can be enhanced in future)
    strategy: '', // Not in new schema but may be needed
    owner: row[COLUMN_NAMES.relManager] || '', // Map relManager to owner for compatibility
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
