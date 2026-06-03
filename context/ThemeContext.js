import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

// True black dark mode — let the accent colors do the work
export const themes = {
  dark: {
    bg:       '#000000',   // true black
    card:     '#161616',   // raised surface
    border:   '#262626',   // subtle dividers
    text:     '#ffffff',   // crisp white
    subtext:  '#8a8a8a',   // neutral muted
    input:    '#121212',
    overlay:  'rgba(0, 0, 0, 0.75)',
  },
  light: {
    bg:       '#fff8f6',   // peach-tinted off-white
    card:     '#ffffff',
    border:   '#f0e0e0',
    text:     '#1a0d12',
    subtext:  '#8a7882',
    input:    '#fdf0ed',
    overlay:  'rgba(255, 248, 246, 0.7)',
  },
};

// Accent palette — vivid peach/pink forward
export const accents = {
  peach:    '#ff7a5c',    // vivid peach (default) — punchy, sunset-coded
  pink:     '#ff5b8a',    // hot baby pink
  coral:    '#ff6a6a',    // bright coral
  rose:     '#ff5e88',    // bold rose
  apricot:  '#ff9a3c',    // glowing apricot
};

// Gradient pairs for each accent — use with expo-linear-gradient
export const gradients = {
  peach:    ['#ff9670', '#ff4e7a'],          // peach → hot pink
  pink:     ['#ff7eb0', '#ff3d6e'],          // pink → magenta
  coral:    ['#ff8a7a', '#ff4a5e'],          // coral → red-pink
  rose:     ['#ff7aa0', '#e83d7a'],          // rose → bold pink
  apricot:  ['#ffb547', '#ff5e3a'],          // golden → orange-red
  sunset:   ['#ffb547', '#ff5b8a', '#c44fff'], // gold → pink → lilac
};

export function ThemeProvider({ children }) {
  const [mode, setMode]               = useState('dark');
  const [accent, setAccent]           = useState('peach');
  const [customColor, setCustomColor] = useState(null);

  const accentColor = accent === 'custom' && customColor
    ? customColor
    : accents[accent] || accents.peach;

  const gradient = gradients[accent] || gradients.peach;

  return (
    <ThemeContext.Provider value={{
      mode,
      setMode,
      accent,
      setAccent,
      customColor,
      setCustomColor,
      theme: themes[mode],
      accentColor,
      gradient,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);