import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    bg:       '#17111f',
    card:     '#24192e',
    border:   '#3a2848',
    text:     '#fff7fb',
    subtext:  '#c7adcf',
    input:    '#21172b',
    overlay:  'rgba(23, 17, 31, 0.78)',
  },
  light: {
    bg:       '#fff6fb',
    card:     '#ffffff',
    border:   '#f5d6e8',
    text:     '#2b1833',
    subtext:  '#9b779f',
    input:    '#fff0f8',
    overlay:  'rgba(255, 246, 251, 0.72)',
  },
};

export const accents = {
  blossom:  '#f472b6',
  bluebell: '#7db7ff',
  lilac:    '#a78bfa',
  peach:    '#ff9bb3',
  mint:     '#7edfc7',
};

export const gradients = {
  blossom:  ['#f9a8d4', '#93c5fd'],
  bluebell: ['#bfdbfe', '#f0abfc'],
  lilac:    ['#c4b5fd', '#fbcfe8'],
  peach:    ['#fecdd3', '#f9a8d4'],
  mint:     ['#99f6e4', '#bfdbfe'],
};

export function ThemeProvider({ children }) {
  const [mode, setMode]               = useState('light');
  const [accent, setAccent]           = useState('blossom');
  const [customColor, setCustomColor] = useState(null);

  const accentColor = accent === 'custom' && customColor
    ? customColor
    : accents[accent] || accents.blossom;

  const gradient = gradients[accent] || gradients.blossom;

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
