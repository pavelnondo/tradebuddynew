import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, ThemeConfig } from '../config/themes';

interface ThemeContextType {
  currentTheme: string;
  themeConfig: ThemeConfig;
  setTheme: (themeName: string) => void;
  glowIntensity: number;
  setGlowIntensity: (intensity: number) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
  themes: Record<string, ThemeConfig>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (!themes[savedTheme]) {
      localStorage.removeItem('theme');
      return 'dark';
    }
    return savedTheme;
  });
  const [glowIntensity, setGlowIntensity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('glowIntensity') || '0.5');
  });
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.1');
  });

  const themeConfig = themes[currentTheme] || themes.dark;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);

    // Apply CSS variables
    document.documentElement.style.setProperty('--background', themeConfig.bg);
    document.documentElement.style.setProperty('--theme-bg', themeConfig.bg);
    document.documentElement.style.setProperty('--theme-card', themeConfig.card);
    document.documentElement.style.setProperty('--theme-border', themeConfig.border);
    document.documentElement.style.setProperty('--theme-accent', themeConfig.accent);
    document.documentElement.style.setProperty('--theme-glow', themeConfig.glow);
    document.documentElement.style.setProperty('--theme-text', themeConfig.foreground);
    document.documentElement.style.setProperty('--theme-muted', themeConfig.mutedForeground);
    document.documentElement.style.setProperty('--theme-success', themeConfig.success);
    document.documentElement.style.setProperty('--theme-danger', themeConfig.destructive);
    document.documentElement.style.setProperty('--theme-warning', themeConfig.warning);
    document.documentElement.style.setProperty('--theme-info', themeConfig.info);
    document.documentElement.style.setProperty('--theme-primary', themeConfig.primary);
    document.documentElement.style.setProperty('--theme-secondary', themeConfig.secondary);
    document.documentElement.style.setProperty('--foreground', themeConfig.foreground);
    document.documentElement.style.setProperty('--card', themeConfig.card);
    document.documentElement.style.setProperty('--card-foreground', themeConfig.cardForeground);
    document.documentElement.style.setProperty('--popover', themeConfig.popover);
    document.documentElement.style.setProperty('--popover-foreground', themeConfig.popoverForeground);
    document.documentElement.style.setProperty('--primary', themeConfig.primary);
    document.documentElement.style.setProperty('--primary-foreground', themeConfig.primaryForeground);
    document.documentElement.style.setProperty('--secondary', themeConfig.secondary);
    document.documentElement.style.setProperty('--secondary-foreground', themeConfig.secondaryForeground);
    document.documentElement.style.setProperty('--muted', themeConfig.muted);
    document.documentElement.style.setProperty('--muted-foreground', themeConfig.mutedForeground);
    document.documentElement.style.setProperty('--accent', themeConfig.accent);
    document.documentElement.style.setProperty('--accent-foreground', themeConfig.accentForeground);
    document.documentElement.style.setProperty('--destructive', themeConfig.destructive);
    document.documentElement.style.setProperty('--destructive-foreground', themeConfig.destructiveForeground);
    document.documentElement.style.setProperty('--border', themeConfig.border);
    document.documentElement.style.setProperty('--input', themeConfig.input);
    document.documentElement.style.setProperty('--ring', themeConfig.ring);
    document.documentElement.style.setProperty('--glow', themeConfig.glow);
    document.documentElement.style.setProperty('--chart-line', themeConfig.chartLine);
    document.documentElement.style.setProperty('--chart-bar', themeConfig.chartBar);
    document.documentElement.style.setProperty('--chart-area', themeConfig.chartArea);
    document.documentElement.style.setProperty('--chart-text', themeConfig.chartText);
    document.documentElement.style.setProperty('--chart-grid', themeConfig.chartGrid);
    document.documentElement.style.setProperty('--success', themeConfig.success);
    document.documentElement.style.setProperty('--warning', themeConfig.warning);
    document.documentElement.style.setProperty('--info', themeConfig.info);
    document.documentElement.style.setProperty('--shadow', themeConfig.shadow);

    // Apply glow intensity and background opacity
    document.documentElement.style.setProperty('--glow-intensity', glowIntensity.toString());
    document.documentElement.style.setProperty('--background-opacity', backgroundOpacity.toString());

  }, [currentTheme, themeConfig, glowIntensity, backgroundOpacity]);

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('theme', themeName);
    } else {
      setCurrentTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const updateGlowIntensity = (intensity: number) => {
    setGlowIntensity(intensity);
    localStorage.setItem('glowIntensity', intensity.toString());
  };

  const updateBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity);
    localStorage.setItem('backgroundOpacity', opacity.toString());
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        setTheme,
        glowIntensity,
        setGlowIntensity: updateGlowIntensity,
        backgroundOpacity,
        setBackgroundOpacity: updateBackgroundOpacity,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};