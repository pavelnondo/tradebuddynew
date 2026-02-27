// Re-export Trade types from the standardized trade.ts file
export type { TradeType, Emotion } from './trade';
export type { Trade } from './trade';
export { TradeCalculator } from './trade';

// Legacy type aliases for backward compatibility
export type EmotionType = "Confident" | "Nervous" | "Greedy" | "Fearful" | "Calm" | "Excited" | "Frustrated" | "Satisfied";

// Legacy Trade interface - DEPRECATED: Use Trade from './trade' instead
// Kept for backward compatibility with older code
export interface LegacyTrade {
  id: string;
  accountId?: string;
  date: string;
  asset: string;
  tradeType: "Buy" | "Sell" | "Long" | "Short";
  type?: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  profitLoss: number;
  notes: string;
  emotion: EmotionType;
  screenshot?: string;
  duration?: number;
  setup?: string;
  executionQuality?: number;
  checklist_id?: string;
  checklist_completed?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed?: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}
