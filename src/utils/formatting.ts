/**
 * Global formatting utilities
 * Unified formatting for currency, percentages, dates, and numbers
 */

/** Strip [Voice note recorded HH:MM:SS] placeholders from notes for display */
export function stripVoiceNotePlaceholders(notes: string | null | undefined): string {
  if (!notes) return '';
  // Strip both old format [Voice note recorded HH:MM:SS] and new format [Voice note DD/MM/YYYY, HH:MM:SS]
  return notes
    .replace(/\[Voice note recorded \d{1,2}:\d{2}:\d{2}(?::\d{2})?\]\s*/gi, '')
    .replace(/\[Voice note \d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2}:\d{2}\]\s*/gi, '')
    .trim();
}

import { format, parseISO } from 'date-fns';
import { useUIStore } from '@/stores/useUIStore';
import { API_BASE_URL, API_ORIGIN } from '@/config';

/**
 * Format currency with proper symbol and decimals
 * Uses sufficient precision for small fractional amounts (e.g. 0.05) to avoid 0.05→0.1 rounding
 */
export function formatCurrency(amount: number, options?: { minDecimals?: number }): string {
  const { currencyFormat, numberPrecision } = useUIStore.getState();
  
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };
  
  const symbol = symbols[currencyFormat] || '$';
  // For small fractional amounts (<1), use at least 2 decimals so 0.05 doesn't round to 0.1
  const minDecimals = options?.minDecimals ?? (Math.abs(amount) < 1 && amount !== 0 ? 2 : 0);
  const precision = Math.max(numberPrecision, minDecimals);
  const formatted = Math.abs(amount).toFixed(precision);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${parts.join('.')}`;
}

/**
 * Format percentage with proper decimals
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date according to user preference
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const { dateFormat } = useUIStore.getState();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  const formats: Record<string, string> = {
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
  };
  
  return format(dateObj, formats[dateFormat] || 'MM/dd/yyyy');
}

/**
 * Format number with proper decimals and thousand separators
 */
export function formatNumber(value: number, decimals?: number): string {
  const { numberPrecision } = useUIStore.getState();
  const precision = decimals !== undefined ? decimals : numberPrecision;
  
  const formatted = value.toFixed(precision);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

/**
 * Format P&L with color indication
 */
export function formatPnL(pnl: number): { text: string; color: string } {
  const { pnlColorScheme } = useUIStore.getState();
  const formatted = formatCurrency(pnl);
  
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;
  
  let color: string;
  if (pnlColorScheme === 'green-red') {
    color = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280';
  } else {
    color = isPositive ? '#ef4444' : isNegative ? '#10b981' : '#6b7280';
  }
  
  return { text: formatted, color };
}

/**
 * Format duration (minutes to human readable)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }
  
  return `${days}d`;
}

/**
 * Format time (HH:MM)
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get full URL for voice note audio file
 */
export function getVoiceNoteAudioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = API_ORIGIN || API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
}

