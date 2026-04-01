export const GOOGLE_SHEET_CONFIG = {
  sheetId: "1JceTKVypT7p5KzUfL4NpoeuJoGp_s4k48Rj1qEL9ARI",
  getCsvUrl() { return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`; }
};

export const COLUMN_NAMES = {
  id: "Stakeholder ID", entityType: "Entity Type", name: "Stakeholder Name", category: "Category", 
  organization: "Organization", role: "Role in Ecosystem", influence: "Influence", interest: "Interest",
  position: "Position", strategy: "Engagement Strategy", owner: "Owner", lastInteraction: "Last Interaction Date",
  nextAction: "Next Action", priority: "Priority", notes: "Notes"
};
