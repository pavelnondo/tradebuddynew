
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
  screenshot?: string; // URL to the screenshot
}
