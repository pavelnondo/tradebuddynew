import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  currency: string;
  dateFormat: string;
  initialBalance: number;
  setCurrency: (currency: string) => void;
  setDateFormat: (format: string) => void;
  setInitialBalance: (balance: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [dateFormat, setDateFormatState] = useState<string>('MM/DD/YYYY');
  const [initialBalance, setInitialBalanceState] = useState<number>(10000);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tradingSettings');
    const savedBalance = localStorage.getItem('initialTradingBalance');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCurrencyState(settings.currency || 'USD');
      setDateFormatState(settings.dateFormat || 'MM/DD/YYYY');
    }
    
    if (savedBalance) {
      setInitialBalanceState(parseFloat(savedBalance));
    }
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    const settings = JSON.parse(localStorage.getItem('tradingSettings') || '{}');
    settings.currency = newCurrency;
    localStorage.setItem('tradingSettings', JSON.stringify(settings));
  };

  const setDateFormat = (newFormat: string) => {
    setDateFormatState(newFormat);
    const settings = JSON.parse(localStorage.getItem('tradingSettings') || '{}');
    settings.dateFormat = newFormat;
    localStorage.setItem('tradingSettings', JSON.stringify(settings));
  };

  const setInitialBalance = (newBalance: number) => {
    setInitialBalanceState(newBalance);
    localStorage.setItem('initialTradingBalance', newBalance.toString());
  };

  const formatCurrency = (amount: number): string => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
    };

    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      case 'MM/DD/YYYY':
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  };

  const value = {
    currency,
    dateFormat,
    initialBalance,
    setCurrency,
    setDateFormat,
    setInitialBalance,
    formatCurrency,
    formatDate,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}



