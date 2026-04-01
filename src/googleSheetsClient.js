// ═══════════════════════════════════════════════════════════════════════════════
// Google Sheets Client - Simple & Robust CSV Reader
// ═══════════════════════════════════════════════════════════════════════════════

import { GOOGLE_SHEET_CONFIG, COLUMN_NAMES } from './config'

// Simple CSV parser - handles comma separation
const parseCSVSimple = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Get headers from first line
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  
  console.log('📋 Headers:', headers);

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.split(',').map(c => c.trim());
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = cells[idx] || '';
    });
    
    // Only add rows with data
    if (Object.values(row).some(v => v)) {
      rows.push(row);
    }
  }
  
  return rows;
};

// Convert sheet row to app format
const mapRowToApp = (row, id) => {
  return {
    id,
    name: row[COLUMN_NAMES.name] || '',
    category: row[COLUMN_NAMES.category] || '',
    organization: row[COLUMN_NAMES.organization] || '',
    role: row[COLUMN_NAMES.role] || '',
    influence: row[COLUMN_NAMES.influence] || 'Medium',
    interest: row[COLUMN_NAMES.interest] || 'Medium',
    position: row[COLUMN_NAMES.position] || 'Neutral',
    strategy: row[COLUMN_NAMES.strategy] || '',
    owner: row[COLUMN_NAMES.owner] || '',
    recentDevelopments: row[COLUMN_NAMES.recentDevelopments] || '',
    engagementHistory: row[COLUMN_NAMES.engagementHistory] || '',
    opportunityWindow: row[COLUMN_NAMES.opportunityWindow] || '',
    lastInteraction: row[COLUMN_NAMES.lastInteraction] || '',
    nextAction: row[COLUMN_NAMES.nextAction] || '',
    priority: row[COLUMN_NAMES.priority] || 'Medium',
  };
};

// Main fetch function
export const fetchStakeholders = async () => {
  try {
    console.log('🔄 Fetching from Google Sheet...');
    const csvUrl = GOOGLE_SHEET_CONFIG.getCsvUrl();
    console.log('📡 URL:', csvUrl);
    
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('✅ CSV received, length:', csvText.length);
    console.log('📄 First 300 chars:', csvText.substring(0, 300));
    
    const rows = parseCSVSimple(csvText);
    console.log('✨ Parsed rows:', rows.length);
    
    if (rows.length === 0) {
      throw new Error('No data rows found in sheet. Make sure data starts from row 2.');
    }
    
    const stakeholders = rows.map((row, idx) => mapRowToApp(row, idx + 1));
    console.log('🎉 Loaded:', stakeholders.length, 'stakeholders');
    console.log('👀 Sample:', stakeholders[0]);
    
    return stakeholders;
  } catch (error) {
    console.error('❌ FETCH ERROR:', error.message);
    console.error('📌 Troubleshooting:');
    console.error('   1. Sheet ID correct? Check config.js');
    console.error('   2. Sheet publicly shared?');
    console.error('   3. Data in sheet? (Row 1 = headers, Row 2 = data)');
    console.error('   4. No extra blank rows at top?');
    throw error;
  }
};
