export const GOOGLE_SHEET_CONFIG = {
  sheetId: "1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI",
  
  // Sheet GIDs and their corresponding state names (as they appear in sheets)
  stateSheets: {
    "National": 1749540502,
    "Rajasthan": 909767070,
    "Madhya Pradesh": 1699599823,
    // "Full State Name": gidNumber, // Add new states here as they're created
  },
  
  getCsvUrl() { 
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`;
  },
  
  // Helper: Get all GIDs from stateSheets config
  getAllStateGids() {
    return Object.values(this.stateSheets);
  },
  
  // Helper: Get state name from GID
  getStateFromGid(gid) {
    for (const [state, stateGid] of Object.entries(this.stateSheets)) {
      if (stateGid === gid) return state;
    }
    return null;
  },
  
  // Helper: Get all state names
  getAllStateNames() {
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
