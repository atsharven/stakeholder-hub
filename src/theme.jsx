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
    document.documentElement.style.backgroundColor = theme.bg;
    document.documentElement.style.color = theme.text;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
