
export type TradeType = "Buy" | "Sell" | "Long" | "Short";

export type EmotionType = "Confident" | "Nervous" | "Greedy" | "Fearful" | "Calm" | "Excited" | "Frustrated" | "Satisfied";

export interface Trade {
  id: string;
  date: string;
  asset: string;
  tradeType: TradeType;
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
