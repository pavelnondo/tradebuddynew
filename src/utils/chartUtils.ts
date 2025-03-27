
import { ReactNode } from 'react';

export interface ChartConfig {
  [key: string]: {
    label?: ReactNode;
    color?: string;
  };
}

export const defaultChartConfig: ChartConfig = {
  profit: {
    label: 'Profit',
    color: 'hsl(var(--success))',
  },
  loss: {
    label: 'Loss',
    color: 'hsl(var(--destructive))',
  },
  balance: {
    label: 'Balance',
    color: 'hsl(var(--primary))',
  },
  drawdown: {
    label: 'Drawdown',
    color: 'hsl(var(--destructive))',
  },
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export function getEmptyDataMessage(dataType: string): string {
  const messages: Record<string, string> = {
    trades: "No trades found. Add some trades to see analysis.",
    profit: "No profit data available. Complete more trades to see this chart.",
    balance: "No balance data available. Add some trades to track your account balance.",
    performance: "No performance data available. Add trades to see metrics.",
    default: "No data available for analysis.",
  };
  
  return messages[dataType] || messages.default;
}
