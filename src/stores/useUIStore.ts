/**
 * UI State Store
 * Manages theme, display preferences, and UI settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type CurrencyFormat = 'USD' | 'EUR' | 'GBP' | 'JPY';
type NumberPrecision = 0 | 1 | 2 | 3 | 4;

interface UIStore {
  // Theme
  theme: Theme;
  accentColor: string;
  
  // Display
  dateFormat: DateFormat;
  currencyFormat: CurrencyFormat;
  numberPrecision: NumberPrecision;
  pnlColorScheme: 'green-red' | 'red-green'; // green-red = green for profit, red for loss
  
  // Notifications
  notifications: {
    dailySummary: boolean;
    weeklyReport: boolean;
    goalReminders: boolean;
    habitReminders: boolean;
  };
  
  // Actions
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setDateFormat: (format: DateFormat) => void;
  setCurrencyFormat: (format: CurrencyFormat) => void;
  setNumberPrecision: (precision: NumberPrecision) => void;
  setPnLColorScheme: (scheme: 'green-red' | 'red-green') => void;
  setNotification: (key: keyof UIStore['notifications'], value: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'system',
      accentColor: '#3b82f6',
      dateFormat: 'MM/DD/YYYY',
      currencyFormat: 'USD',
      numberPrecision: 2,
      pnlColorScheme: 'green-red',
      notifications: {
        dailySummary: true,
        weeklyReport: true,
        goalReminders: true,
        habitReminders: true,
      },
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setCurrencyFormat: (format) => set({ currencyFormat: format }),
      setNumberPrecision: (precision) => set({ numberPrecision: precision }),
      setPnLColorScheme: (scheme) => set({ pnlColorScheme: scheme }),
      setNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    {
      name: 'ui-storage',
    }
  )
);

