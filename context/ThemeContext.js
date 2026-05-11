import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    bg: '#080808',
    card: '#111',
    border: '#1e1e1e',
    text: '#ffffff',
    subtext: '#666',
    input: '#141414',
  },
  light: {
    bg: '#f5f5f5',
    card: '#ffffff',
    border: '#e0e0e0',
    text: '#0a0a0a',
    subtext: '#888',
    input: '#f0f0f0',
  },
};

export const accents = {
  purple: '#7c3aed',
  red: '#dc2626',
  pink: '#db2777',
  blue: '#2563eb',
  green: '#16a34a',
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [accent, setAccent] = useState('purple');
  const [customColor, setCustomColor] = useState(null);

  return (
    <ThemeContext.Provider value={{
      mode,
      setMode,
      accent,
      setAccent,
      customColor,
      setCustomColor,
      theme: themes[mode],
      accentColor: accent === 'custom' && customColor ? customColor : accents[accent] || accents.purple,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);