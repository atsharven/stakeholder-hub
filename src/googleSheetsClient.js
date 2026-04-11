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
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cells = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => row[h] = cells[idx] || '');
    
    // Only add if has at least one non-empty value
    if (Object.values(row).some(v => v && v.trim())) rows.push(row);
  }
  
  // Debug: Show parsing stats
  console.log(`  ✓ Parsed ${rows.length} data rows (${lines.length - 1} total lines)`);
  console.log(`  Cells in first row: ${parseCSVLine(lines[1]).length}`);
  
  return rows;
};

const mapRow = (row, rowIndex) => {
  // Normalize state name from sheet to state code
  const rawState = row[COLUMN_NAMES.state] || '';
  const normalizedState = GOOGLE_SHEET_CONFIG.normalizeStateName(rawState);
  
  // Debug: Log first row to see what's in it
  if (rowIndex === 0) {
    console.log(`  ✓ Row 0 mapping check:`);
    console.log(`    ID ("${COLUMN_NAMES.id}"): "${row[COLUMN_NAMES.id]}"`);
    console.log(`    State ("${COLUMN_NAMES.state}"): "${row[COLUMN_NAMES.state]}"`);
    console.log(`    Name ("${COLUMN_NAMES.name}"): "${row[COLUMN_NAMES.name]}"`);
    console.log(`    Organisation ("${COLUMN_NAMES.organization}"): "${row[COLUMN_NAMES.organization]}"`);
    console.log(`    Sector ("${COLUMN_NAMES.category}"): "${row[COLUMN_NAMES.category]}"`);
    console.log(`  Full row keys:`, Object.keys(row));
  }
  
  return {
    id: row[COLUMN_NAMES.id] || '',
    state: normalizedState, // Use normalized state code (e.g., "RJ" not "Rajasthan")
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
  
  try {
    const response = await fetch(csvUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Failed to fetch sheet GID ${gid}`);
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Debug: Check header names and show actual data structure
    if (csvText && rows.length > 0) {
      const lines = csvText.split('\n');
      const headerLine = lines[0];
      const headerArray = parseCSVLine(headerLine);
      
      const stateCode = GOOGLE_SHEET_CONFIG.getStateFromGid(gid);
      console.log(`\n📋 Sheet Headers for ${stateCode} (GID: ${gid}):`);
      console.log('Headers:', headerArray);
      console.log('Header count:', headerArray.length);
      
      // Show column indices with actual headers
      headerArray.forEach((header, idx) => {
        console.log(`  [${idx}] "${header}"`);
      });
      
      // Show first row of actual data
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log(`\n🔍 Sample data from ${stateCode}:`);
        console.log('First row keys:', Object.keys(firstRow));
        console.log('First row values:', {
          id: firstRow.id,
          state: firstRow.state,
          name: firstRow.name,
          organization: firstRow.organization,
          category: firstRow.category
        });
      }
    }
    
    return rows.map((row, idx) => mapRow(row, idx));
  } catch (error) {
    console.warn(`Could not fetch sheet GID ${gid}:`, error.message);
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
    // Fetch all sheets in parallel
    const allSheetPromises = sheetGids.map(gid => 
      fetchSheetByGid(gid).then(rows => rows.map(row => ({
        ...row,
        // Ensure state is set based on GID if not already in data
        state: row.state || GOOGLE_SHEET_CONFIG.getStateFromGid(gid) || 'Unknown'
      })))
    );
    
    const allSheetResults = await Promise.all(allSheetPromises);
    
    // Combine all stakeholders from all sheets
    const allStakeholders = allSheetResults.flat();
    
    if (allStakeholders.length === 0) {
      throw new Error('No data found across all sheets');
    }
    
    // Debug: Log sample data and counts
    console.log(`✓ Loaded ${allStakeholders.length} total stakeholders from ${sheetGids.length} sheets`);
    console.log(`  - National: ${allStakeholders.filter(s => s.state === 'National').length}`);
    console.log(`  - RJ: ${allStakeholders.filter(s => s.state === 'RJ').length}`);
    console.log(`  - MP: ${allStakeholders.filter(s => s.state === 'MP').length}`);
    console.log(`  - Unknown state: ${allStakeholders.filter(s => s.state === 'Unknown').length}`);
    
    // Show sample of first 3 rows to inspect data quality
    console.log('📊 Sample data (first 3 rows):', allStakeholders.slice(0, 3).map(s => ({
      id: s.id,
      name: s.name,
      state: s.state,
      organization: s.organization,
      influence: s.influence,
      interest: s.interest
    })));
    
    return allStakeholders;
  } catch (error) {
    console.error('Error fetching stakeholders:', error);
    throw error;
  }
};
