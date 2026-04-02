// Modern Minimal Theme System
export const theme = {
  bg: "#0a0e27",
  card: "#111633",
  cardHover: "#181d3a",
  border: "#1e2749",
  borderLight: "#2a3461",
  text: "#e8ecf1",
  textSecondary: "#b4b9c3",
  textMuted: "#8b92a1",
  accentPrimary: "#6366f1",
  accentPrimaryLight: "#818cf8",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0ea5e9",
};

export const categoryColors = {
  Government: "#6366f1",
  Political: "#a78bfa",
  "NGO/Civil Society": "#10b981",
  Corporate: "#0ea5e9",
  Academic: "#f59e0b",
  Media: "#ef4444",
  Community: "#f97316",
  International: "#14b8a6",
};

export const levelColors = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export const positionColors = {
  Supportive: "#10b981",
  Neutral: "#8b92a1",
  Resistant: "#ef4444",
};

export const sentimentColors = {
  Positive: "#10b981",
  Neutral: "#8b92a1",
  Negative: "#ef4444",
};

export const relationshipColors = {
  Involved: "#6366f1",
  Affected: "#f59e0b",
  Interested: "#10b981",
};

// Responsive breakpoints
export const breakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

// Responsive styles creator
export const responsive = {
  container: (maxWidth = 1600) => ({
    maxWidth,
    margin: "0 auto",
    padding: "16px",
    "@media (max-width: 768px)": {
      padding: "12px",
    },
  }),
  
  gridAuto: (colsMobile = 1, colsTablet = 2, colsDesktop = 3 | 4) => ({
    mobile: { gridTemplateColumns: `repeat(${colsMobile}, 1fr)`, gap: "16px" },
    tablet: { gridTemplateColumns: `repeat(${colsTablet}, 1fr)`, gap: "20px" },
    desktop: { gridTemplateColumns: `repeat(${colsDesktop}, 1fr)`, gap: "20px" },
  }),
  
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
    xxl: "32px",
  },
  
  fontSize: {
    xs: "12px",
    sm: "13px",
    base: "14px",
    lg: "16px",
    xl: "18px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "44px",
    "5xl": "54px",
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// Style generators
export const styler = {
  button: (active = false) => ({
    padding: "10px 20px",
    borderRadius: "8px",
    border: `2px solid ${active ? theme.accentPrimaryLight : theme.border}`,
    background: active ? `${theme.accentPrimary}15` : "transparent",
    color: active ? theme.accentPrimaryLight : theme.text,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      borderColor: theme.accentPrimaryLight,
      background: `${theme.accentPrimary}10`,
    },
  }),
  
  label: {
    fontSize: "11px",
    color: theme.textMuted,
    fontWeight: 600,
    marginBottom: "8px",
  },
  
  divider: {
    paddingTop: "20px",
    borderTop: `1px solid ${theme.border}`,
  },
  
  card: (customStyle = {}) => ({
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "20px",
    transition: "all 0.2s",
    ...customStyle,
  }),
};
