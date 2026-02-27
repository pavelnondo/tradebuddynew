export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    gridlines: string;
    primary: string;
    success: string;
    danger: string;
    warning: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    popover: string;
    popoverForeground: string;
  };
  gradients: {
    primary: string;
    success: string;
    danger: string;
    warning: string;
    background: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: 'Light Mode',
    colors: {
      background: '#f9fafb',
      card: '#ffffff',
      text: '#111827',
      subtext: '#6b7280',
      border: '#e5e7eb',
      gridlines: 'rgba(0,0,0,0.08)',
      primary: '#3b82f6',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      accent: '#3b82f6',
      accentForeground: '#ffffff',
      popover: '#ffffff',
      popoverForeground: '#111827',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Dark Mode',
    colors: {
      background: '#0f172a',
      card: '#1e293b',
      text: '#f8fafc',
      subtext: '#94a3b8',
      border: '#334155',
      gridlines: 'rgba(255,255,255,0.12)',
      primary: '#6366f1',
      success: '#22c55e',
      danger: '#ef4444',
      warning: '#facc15',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      accent: '#6366f1',
      accentForeground: '#ffffff',
      popover: '#1e293b',
      popoverForeground: '#f8fafc',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    },
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean Blue',
    colors: {
      background: '#0a192f',
      card: '#112240',
      text: '#ccd6f6',
      subtext: '#8892b0',
      border: '#233554',
      gridlines: 'rgba(100, 255, 218, 0.1)',
      primary: '#64ffda',
      success: '#64ffda',
      danger: '#ff6b6b',
      warning: '#ffd93d',
      muted: '#112240',
      mutedForeground: '#8892b0',
      accent: '#64ffda',
      accentForeground: '#0a192f',
      popover: '#112240',
      popoverForeground: '#ccd6f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #64ffda 0%, #00d4aa 100%)',
      success: 'linear-gradient(135deg, #64ffda 0%, #00d4aa 100%)',
      danger: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
      warning: 'linear-gradient(135deg, #ffd93d 0%, #ffc107 100%)',
      background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(100, 255, 218, 0.1)',
      md: '0 4px 6px -1px rgba(100, 255, 218, 0.2), 0 2px 4px -1px rgba(100, 255, 218, 0.1)',
      lg: '0 10px 15px -3px rgba(100, 255, 218, 0.2), 0 4px 6px -2px rgba(100, 255, 218, 0.1)',
      xl: '0 20px 25px -5px rgba(100, 255, 218, 0.2), 0 10px 10px -5px rgba(100, 255, 218, 0.1)',
    },
  },
  graphite: {
    name: 'graphite',
    displayName: 'Graphite Pro',
    colors: {
      background: '#1a1a1a',
      card: '#2a2a2a',
      text: '#f3f4f6',
      subtext: '#9ca3af',
      border: '#3a3a3a',
      gridlines: 'rgba(249, 115, 22, 0.1)',
      primary: '#f97316',
      success: '#22c55e',
      danger: '#ef4444',
      warning: '#facc15',
      muted: '#2a2a2a',
      mutedForeground: '#9ca3af',
      accent: '#f97316',
      accentForeground: '#ffffff',
      popover: '#2a2a2a',
      popoverForeground: '#f3f4f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(249, 115, 22, 0.1)',
      md: '0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1)',
      lg: '0 10px 15px -3px rgba(249, 115, 22, 0.2), 0 4px 6px -2px rgba(249, 115, 22, 0.1)',
      xl: '0 20px 25px -5px rgba(249, 115, 22, 0.2), 0 10px 10px -5px rgba(249, 115, 22, 0.1)',
    },
  },
  emerald: {
    name: 'emerald',
    displayName: 'Emerald Focus',
    colors: {
      background: '#0d1512',
      card: '#1b2b26',
      text: '#e5e7eb',
      subtext: '#9ca3af',
      border: '#2d3b36',
      gridlines: 'rgba(52, 211, 153, 0.1)',
      primary: '#34d399',
      success: '#34d399',
      danger: '#f87171',
      warning: '#fbbf24',
      muted: '#1b2b26',
      mutedForeground: '#9ca3af',
      accent: '#34d399',
      accentForeground: '#0d1512',
      popover: '#1b2b26',
      popoverForeground: '#e5e7eb',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      success: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      danger: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      background: 'linear-gradient(135deg, #0d1512 0%, #1b2b26 100%)',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(52, 211, 153, 0.1)',
      md: '0 4px 6px -1px rgba(52, 211, 153, 0.2), 0 2px 4px -1px rgba(52, 211, 153, 0.1)',
      lg: '0 10px 15px -3px rgba(52, 211, 153, 0.2), 0 4px 6px -2px rgba(52, 211, 153, 0.1)',
      xl: '0 20px 25px -5px rgba(52, 211, 153, 0.2), 0 10px 10px -5px rgba(52, 211, 153, 0.1)',
    },
  },
};

export const defaultTheme = 'light';
export const systemTheme = 'system';
