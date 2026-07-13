import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    bg:       '#181116',
    card:     '#241a20',
    panel:    '#2c2027',
    paper:    '#fff8f1',
    border:   '#3a2a33',
    text:     '#fff8f1',
    subtext:  '#d5bdc9',
    input:    '#2f2229',
    shadow:   '#000000',
    overlay:  'rgba(24, 17, 22, 0.78)',
  },
  light: {
    bg:       '#fff8f1',
    card:     '#ffffff',
    panel:    '#f4e2d8',
    paper:    '#fffdf9',
    border:   '#ead9d2',
    text:     '#18151d',
    subtext:  '#8d7f87',
    input:    '#f7ece8',
    shadow:   '#cfb7aa',
    overlay:  'rgba(255, 248, 241, 0.72)',
  },
};

export const accents = {
  blossom:  '#f3a0bb',
  bluebell: '#88afe9',
  lilac:    '#aca7df',
  peach:    '#eba18c',
  mint:     '#9ebd8f',
  butter:   '#efd96f',
};

export const gradients = {
  blossom:  ['#f9c5d5', '#b9cdf7'],
  bluebell: ['#c9dcff', '#efd4ec'],
  lilac:    ['#d7d1ff', '#f6cddd'],
  peach:    ['#f5cabc', '#f0dc94'],
  mint:     ['#c9dfc0', '#b7d8ec'],
  butter:   ['#f6e48c', '#efb8a7'],
};

export const moodColors = {
  happy:   '#efd96f',
  calm:    '#9ebd8f',
  sad:     '#ead9d2',
  angry:   '#e58d75',
  anxious: '#aca7df',
  soft:    '#f3a0bb',
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
