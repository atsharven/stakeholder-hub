// ═══════════════════════════════════════════════════════════════════════════════
// CENTRALIZED CONFIGURATION
// All secrets, API keys, and constants in one place
// ═══════════════════════════════════════════════════════════════════════════════

// Google Sheets Configuration
export const GOOGLE_SHEET_CONFIG = {
  // Your Google Sheet ID - update this with your actual sheet ID
  sheetId: "1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI",
  
  // Get CSV export URL automatically
  getCsvUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`;
  }
};

// Column Names - MUST match your Google Sheet column headers exactly
export const COLUMN_NAMES = {
  name: "Stakeholder Name",
  category: "Category",
  organization: "Organization",
  role: "Role in Ecosystem",
  influence: "Influence",
  interest: "Interest",
  position: "Position",
  strategy: "Engagement Strategy",
  owner: "Owner",
  recentDevelopments: "Recent Developments",
  engagementHistory: "Engagement History",
  opportunityWindow: "Opportunity Window",
  lastInteraction: "Last Interaction Date",
  nextAction: "Next Action",
  priority: "Priority"
};

// Supabase Configuration (commented out but available)
// export const SUPABASE_CONFIG = {
//   url: "https://hcaifttlndeqqbrviodw.supabase.co",
//   anonKey: "sb_publishable_YVF5lA3xIi_STXglZUGDqQ_MBwlBw7p"
// };
