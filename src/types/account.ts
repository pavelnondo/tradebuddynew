export interface TradingJournal {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  isBlown: boolean;
  isPassed: boolean;
  createdAt: string;
  blownAt?: string;
  passedAt?: string;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
}

export interface JournalStats {
  totalJournals: number;
  activeJournals: number;
  blownJournals: number;
  passedJournals: number;
  totalTradesAcrossJournals: number;
  totalPnLAcrossJournals: number;
  overallWinRate: number;
}

// Keep the old interface for backward compatibility
export type TradingAccount = TradingJournal;
export type AccountStats = JournalStats;
