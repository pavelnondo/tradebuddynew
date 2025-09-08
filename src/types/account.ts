export interface TradingAccount {
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

export interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  blownAccounts: number;
  passedAccounts: number;
  totalTradesAcrossAccounts: number;
  totalPnLAcrossAccounts: number;
  overallWinRate: number;
}
