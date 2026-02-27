/**
 * Standardized Trade data model
 * Single source of truth for trade data structure
 */

export type TradeType = "buy" | "sell" | "long" | "short";
export type TradeSession = "Asia" | "London" | "NewYork" | "Other";

export type Emotion = 
  | "confident" 
  | "calm" 
  | "excited" 
  | "nervous"
  | "frustrated" 
  | "greedy" 
  | "fearful"
  | "fomo" 
  | "satisfied" 
  | "disappointed";

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  positionSize: number;
  entryTime: Date;
  exitTime: Date | null;
  /** Primary emotion (first in list for single-emotion trades). Kept for backward compatibility. */
  emotion: Emotion;
  /** Multiple emotions when user selects more than one. Stored as comma-separated in DB. */
  emotions?: Emotion[];
  confidenceLevel?: number | null;
  executionQuality?: number | null;
  setupType: string;
  marketCondition?: string | null;
  notes: string;
  tags: string[];
  screenshot: string | null;
  pnl: number;
  pnlPercent: number;
  rr: number | null; // Risk/Reward ratio
  duration: number; // minutes
  accountId?: string;
  journalId?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  /** Pre-trade checklist snapshot */
  checklistItems?: Array<{ id: string; text: string; completed: boolean }>;
  /** During-trade checklist snapshot */
  duringChecklistItems?: Array<{ id: string; text: string; completed: boolean }>;
  /** Post-trade checklist snapshot */
  postChecklistItems?: Array<{ id: string; text: string; completed: boolean }>;
  /** Rules checklist snapshot - rules followed during this trade */
  ruleItems?: Array<{ id: string; text: string; completed: boolean }>;
  /** Voice note attachments - URLs to uploaded audio files. field: 'notes' | 'lessons' for section. */
  voiceNoteUrls?: Array<{ url: string; duration?: number; transcript?: string; field?: string }>;
  /** Setup/entry grade: A, B, or C */
  tradeGrade?: 'A' | 'B' | 'C' | null;
  /** Lessons learnt from this trade - synced to Education when saved */
  lessonsLearned?: string | null;
  /** Planned fixed-$ risk amount before entry */
  plannedRiskAmount?: number | null;
  /** Planned risk as % of account */
  plannedRiskPercent?: number | null;
  /** Planned stop loss level */
  stopLossPrice?: number | null;
  /** Planned take profit level */
  takeProfitPrice?: number | null;
  /** Planned risk/reward ratio before entry */
  plannedRR?: number | null;
  /** Realized risk/reward ratio */
  actualRR?: number | null;
  /** R multiple for the trade */
  rMultiple?: number | null;
  /** Trade index within the day (1..n) */
  tradeNumberOfDay?: number | null;
  /** Trading session tag */
  session?: TradeSession | null;
  /** Whether trade followed consistent risk sizing */
  riskConsistencyFlag?: boolean | null;
  /** % completed checklist items across all checklist groups */
  checklistCompletionPercent?: number | null;
}

/**
 * Trade calculation utilities
 */
export class TradeCalculator {
  static calculatePnL(entryPrice: number, exitPrice: number | null, quantity: number, type: TradeType): number {
    if (!exitPrice) return 0;
    
    const priceDiff = exitPrice - entryPrice;
    const multiplier = type === "buy" || type === "long" ? 1 : -1;
    
    return priceDiff * quantity * multiplier;
  }

  static calculatePnLPercent(entryPrice: number, exitPrice: number | null, type: TradeType): number {
    if (!exitPrice) return 0;
    
    const priceDiff = exitPrice - entryPrice;
    const multiplier = type === "buy" || type === "long" ? 1 : -1;
    const percent = (priceDiff / entryPrice) * 100 * multiplier;
    
    return Math.round(percent * 100) / 100; // Round to 2 decimals
  }

  static calculatePositionSize(entryPrice: number, quantity: number): number {
    return entryPrice * quantity;
  }

  static calculateDuration(entryTime: Date, exitTime: Date | null): number {
    if (!exitTime) return 0;
    return Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)); // minutes
  }

  static calculateRR(
    entryPrice: number,
    exitPrice: number | null,
    stopLoss: number | null,
    target: number | null,
    type: TradeType
  ): number | null {
    if (!exitPrice || !stopLoss || !target) return null;
    
    const profit = Math.abs(exitPrice - entryPrice);
    const risk = Math.abs(entryPrice - stopLoss);
    
    if (risk === 0) return null;
    
    return Math.round((profit / risk) * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate all trade metrics at once
   */
  static calculateTradeMetrics(trade: Partial<Trade>): Partial<Trade> {
    if (!trade.entryPrice || !trade.quantity || !trade.type) {
      return trade;
    }

    const entryPrice = trade.entryPrice;
    const exitPrice = trade.exitPrice || null;
    const quantity = trade.quantity;
    const type = trade.type;
    const entryTime = trade.entryTime || new Date();
    const exitTime = trade.exitTime || null;

    return {
      ...trade,
      positionSize: TradeCalculator.calculatePositionSize(entryPrice, quantity),
      pnl: TradeCalculator.calculatePnL(entryPrice, exitPrice, quantity, type),
      pnlPercent: TradeCalculator.calculatePnLPercent(entryPrice, exitPrice, type),
      duration: TradeCalculator.calculateDuration(entryTime, exitTime),
      rr: null, // Will be calculated if stopLoss/target are provided
    };
  }
}

