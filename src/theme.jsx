import { useState, useEffect } from 'react';
import { THEMES } from './themeConstants';
import { ThemeContext } from './themeContext';

// ========== THEME CONTEXT ==========

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
    const root = document.documentElement;
    
    // Set background and text colors
    root.style.backgroundColor = theme.bg;
    root.style.color = theme.text;
    
    // Set CSS variables for all theme colors (eliminates inline styles)
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-alpha-10', `${theme.primary}10`);
    root.style.setProperty('--primary-alpha-12', `${theme.primary}12`);
    root.style.setProperty('--primary-alpha-14', `${theme.primary}14`);
    root.style.setProperty('--primary-alpha-20', `${theme.primary}20`);
    root.style.setProperty('--primary-alpha-30', `${theme.primary}30`);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--warning-alpha-33', `${theme.warning}33`);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--card-bg', isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)');
    root.style.setProperty('--chart-bg', isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.76)');
    root.style.setProperty('--shadow-light', isDark ? 'rgba(0,0,0,0.2)' : 'rgba(15,23,42,0.08)');
    root.style.setProperty('--shadow', isDark ? 'rgba(0,0,0,0.4)' : 'rgba(15,23,42,0.15)');
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
