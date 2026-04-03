// Google-Inspired Theme System - Minimal & Modern
import { createContext, useState, useContext, useEffect } from 'react';

// ========== THEME DEFINITIONS ==========

export const THEMES = {
  dark: {
    bg: "#121212",
    surface: "#1e1e1e",
    surfaceVariant: "#262626",
    card: "#1f1f1f",
    cardHover: "#2a2a2a",
    text: "#e8eaed",
    textSecondary: "#b0bec5",
    textMuted: "#80868b",
    primary: "#8ab4f8",
    primaryDark: "#669df6",
    secondary: "#81c995",
    accent: "#f28482",
    border: "#2d2d2d",
    divider: "#3f3f3f",
    success: "#81c995",
    warning: "#fcc934",
    danger: "#f28482",
    info: "#8ab4f8",
    hover: "#ffffff08",
    active: "#ffffff12",
  },

  light: {
    bg: "#ffffff",
    surface: "#f8f9fa",
    surfaceVariant: "#f1f3f4",
    card: "#ffffff",
    cardHover: "#f8f9fa",
    text: "#202124",
    textSecondary: "#5f6368",
    textMuted: "#80868b",
    primary: "#1f71b8",
    primaryDark: "#1557b0",
    secondary: "#0b8043",
    accent: "#d33b27",
    border: "#dadce0",
    divider: "#e8eaed",
    success: "#0b8043",
    warning: "#e37400",
    danger: "#d33b27",
    info: "#1f71b8",
    hover: "#00000008",
    active: "#00000012",
  },
};

// ========== COLOR PALETTES ==========

export const categoryColors = {
  Government: { dark: "#8ab4f8", light: "#1f71b8" },
  Political: { dark: "#c58af9", light: "#7c3aed" },
  "NGO/Civil Society": { dark: "#81c995", light: "#0b8043" },
  Corporate: { dark: "#aecbfa", light: "#0051ba" },
  Academic: { dark: "#fcc934", light: "#e37400" },
  Media: { dark: "#f28482", light: "#d33b27" },
  Community: { dark: "#f6afa8", light: "#c5221f" },
  International: { dark: "#a8dadc", light: "#0d6e6e" },
};

export const levelColors = {
  High: { dark: "#f28482", light: "#d33b27" },
  Medium: { dark: "#fcc934", light: "#e37400" },
  Low: { dark: "#81c995", light: "#0b8043" },
};

export const positionColors = {
  Supportive: { dark: "#81c995", light: "#0b8043" },
  Neutral: { dark: "#80868b", light: "#5f6368" },
  Resistant: { dark: "#f28482", light: "#d33b27" },
};

export const sentimentColors = {
  Positive: { dark: "#81c995", light: "#0b8043" },
  Neutral: { dark: "#80868b", light: "#5f6368" },
  Negative: { dark: "#f28482", light: "#d33b27" },
};

export const relationshipColors = {
  Involved: { dark: "#8ab4f8", light: "#1f71b8" },
  Affected: { dark: "#fcc934", light: "#e37400" },
  Interested: { dark: "#81c995", light: "#0b8043" },
};

// ========== THEME CONTEXT ==========

const ThemeContext = createContext('dark');

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  const theme = THEMES[isDark ? 'dark' : 'light'];

  const toggleTheme = () => {
    setIsDark(prev => {
      localStorage.setItem('theme-mode', prev ? 'light' : 'dark');
      return !prev;
    });
  };

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.bg;
    document.documentElement.style.color = theme.text;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
