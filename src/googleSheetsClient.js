import { GOOGLE_SHEET_CONFIG, COLUMN_NAMES } from './config'

const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('Empty data');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = cells[idx] || '');
    
    if (Object.values(row).some(v => v)) rows.push(row);
  }
  
  return rows;
};

const mapRow = (row) => ({
  id: row[COLUMN_NAMES.id] || '',
  entityType: row[COLUMN_NAMES.entityType] || '',
  name: row[COLUMN_NAMES.name] || '',
  category: row[COLUMN_NAMES.category] || '',
  organization: row[COLUMN_NAMES.organization] || '',
  role: row[COLUMN_NAMES.role] || '',
  influence: row[COLUMN_NAMES.influence] || 'Medium',
  interest: row[COLUMN_NAMES.interest] || 'Medium',
  position: row[COLUMN_NAMES.position] || 'Neutral',
  strategy: row[COLUMN_NAMES.strategy] || '',
  owner: row[COLUMN_NAMES.owner] || '',
  lastInteraction: row[COLUMN_NAMES.lastInteraction] || '',
  nextAction: row[COLUMN_NAMES.nextAction] || '',
  priority: row[COLUMN_NAMES.priority] || 'Medium',
  notes: row[COLUMN_NAMES.notes] || '',
});

export const fetchStakeholders = async () => {
  const csvUrl = GOOGLE_SHEET_CONFIG.getCsvUrl();
  const response = await fetch(csvUrl, { mode: 'cors' });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const csvText = await response.text();
  const rows = parseCSV(csvText);
  
  return rows.map((row) => mapRow(row));
};
