// Apple-inspired TradeBuddy Configuration
// Designed for efficiency, security, and modern development

export const APP_CONFIG = {
  // Application metadata
  name: 'TradeBuddy',
  version: '2.0.0',
  description: 'Apple-inspired trading journal for serious traders',
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 10000,
    retries: 3,
    endpoints: {
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
      },
      trades: {
        list: '/api/trades',
        create: '/api/trades',
        update: (id: string) => `/api/trades/${id}`,
        delete: (id: string) => `/api/trades/${id}`,
        analytics: '/api/analytics/overview',
      },
      accounts: {
        list: '/api/accounts',
        create: '/api/accounts',
        update: (id: string) => `/api/accounts/${id}`,
        delete: (id: string) => `/api/accounts/${id}`,
      },
      user: {
        profile: '/api/user/profile',
        preferences: '/api/user/preferences',
      },
      upload: '/api/upload',
      health: '/api/health',
    }
  },

  // Design System
  design: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
      }
    },
    
    // Apple-inspired spacing system
    spacing: {
      xs: '0.25rem',    // 4px
      sm: '0.5rem',     // 8px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
      xl: '2rem',       // 32px
      '2xl': '3rem',    // 48px
      '3xl': '4rem',    // 64px
      '4xl': '6rem',    // 96px
    },

    // Apple-inspired border radius
    borderRadius: {
      none: '0',
      sm: '0.25rem',    // 4px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
      xl: '1rem',       // 16px
      '2xl': '1.5rem',  // 24px
      full: '9999px',
    },

    // Apple-inspired shadows
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },

    // Apple-inspired typography
    typography: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
    },

    // Apple-inspired animations
    animations: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },

  // Feature flags
  features: {
    darkMode: true,
    realTimeUpdates: true,
    essentialAnalytics: true,
    multiAccountSupport: true,
    exportData: true,
    notifications: true,
    voiceInput: false, // Future feature
    aiInsights: false, // Future feature
  },

  // Trading configuration
  trading: {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
    defaultAccountType: 'paper',
    supportedAccountTypes: ['paper', 'live', 'demo'],
    maxPositionSize: 1000000,
    minPositionSize: 1,
    maxDecimalPlaces: 6,
    timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
  },

  // Performance settings
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    requestTimeout: 10000,
  },

  // Security settings
  security: {
    tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Environment-specific settings
  environment: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    isTest: import.meta.env.MODE === 'test',
  },
};

// Export individual configs for easier imports
export const API_CONFIG = APP_CONFIG.api;
export const DESIGN_CONFIG = APP_CONFIG.design;
export const FEATURES_CONFIG = APP_CONFIG.features;
export const TRADING_CONFIG = APP_CONFIG.trading;
export const PERFORMANCE_CONFIG = APP_CONFIG.performance;
export const SECURITY_CONFIG = APP_CONFIG.security;
export const ENV_CONFIG = APP_CONFIG.environment;

// Utility functions
export const isFeatureEnabled = (feature: keyof typeof FEATURES_CONFIG): boolean => {
  return FEATURES_CONFIG[feature];
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

export const getColor = (color: string, shade: string = '500'): string => {
  return DESIGN_CONFIG.colors[color as keyof typeof DESIGN_CONFIG.colors]?.[shade as keyof typeof DESIGN_CONFIG.colors[keyof typeof DESIGN_CONFIG.colors]] || '#000000';
};

export default APP_CONFIG;
