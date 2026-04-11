export const GOOGLE_SHEET_CONFIG = {
  sheetId: "1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI",
  
  // Sheet GIDs and their corresponding states (state codes)
  stateSheets: {
    "National": 1749540502,
    "RJ": 909767070,
    "MP": 1699599823,
    // "State Code": gidNumber, // Add new states here as they're created
  },
  
  // Map state names (from Google Sheet) to state codes (for internal use)
  // If your sheet says "Rajasthan", we normalize it to "RJ"
  stateNameMap: {
    "National": "National",
    "Rajasthan": "RJ",
    "Madhya Pradesh": "MP",
    "RJ": "RJ", // Accept code too
    "MP": "MP",
  },
  
  getCsvUrl() { 
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`;
  },
  
  // Helper: Get all GIDs from stateSheets config
  getAllStateGids() {
    return Object.values(this.stateSheets);
  },
  
  // Helper: Get state code from GID
  getStateFromGid(gid) {
    for (const [state, stateGid] of Object.entries(this.stateSheets)) {
      if (stateGid === gid) return state;
    }
    return null;
  },
  
  // Helper: Normalize state name from sheet to state code
  normalizeStateName(stateName) {
    const trimmed = (stateName || '').trim();
    return this.stateNameMap[trimmed] || trimmed || 'Unknown';
  },
  
  // Get all unique state codes from config
  getAllStateCodes() {
    return Object.keys(this.stateSheets);
  }
};

// New 19-column schema mapping (updated for new Google Sheet)
export const COLUMN_NAMES = {
  id: "ID",
  state: "State",
  organization: "Organisation",
  name: "Name",
  designation: "Designation",
  category: "Sector", // "Sector" in sheet maps to "category" (org type) in dashboard
  mobile: "Mobile",
  officeNo: "Office No.",
  email: "Email",
  influence: "Influence",
  interest: "Interest",
  position: "Position",
  sentiment: "Sentiment",
  priority: "Priority",
  relManager: "Rel. Manager",
  lastInteraction: "Last Interaction",
  nextActionDate: "Next Action Date",
  nextAction: "Next Action",
  notes: "Notes"
};
