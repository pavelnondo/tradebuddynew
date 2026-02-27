import { Trade, TradeSession } from '@/types/trade';

export interface AnalyticsFilterInput {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  rRange?: { min?: number | null; max?: number | null };
  emotions?: string[];
  setups?: string[];
  sessions?: TradeSession[];
  riskPercentRange?: { min?: number | null; max?: number | null };
  checklistPercentRange?: { min?: number | null; max?: number | null };
  confidenceRange?: { min?: number | null; max?: number | null };
  executionRange?: { min?: number | null; max?: number | null };
  winLoss?: 'win' | 'loss' | 'breakeven' | 'all';
  durationRange?: { min?: number | null; max?: number | null };
  tradeNumberRange?: { min?: number | null; max?: number | null };
  symbols?: string[];
}

export interface RollingPoint {
  index: number;
  tradeId: string;
  date: Date;
  expectancy: number | null;
  winRate: number | null;
  avgR: number | null;
  drawdownR: number | null;
}

export interface EmotionExpectancyRow {
  emotion: string;
  trades: number;
  winRate: number;
  avgR: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  maxDrawdownR: number | null;
}

export interface SetupPerformanceRow {
  setupType: string;
  trades: number;
  winRate: number;
  avgR: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  maxDrawdownR: number | null;
  reliability: 'low' | 'medium' | 'high';
}

export interface DrawdownReport {
  maxDrawdownR: number;
  maxDrawdownPercent: number;
  averageDrawdownR: number;
  drawdownFrequency: number;
  longestDrawdownDuration: number;
  averageRecoveryTrades: number;
}

export interface EquityPoint {
  index: number;
  tradeId: string;
  date: Date;
  rEquity: number;
  pnlEquity: number;
}

export interface MonteCarloSummary {
  simulations: number;
  worstCaseDrawdownR: number;
  expectedDrawdownR: number;
  riskOfRuinProbability: number;
  confidenceBand95: Array<{ step: number; lower: number; upper: number }>;
}

export interface AnalyticsEngineResult {
  filteredTrades: Trade[];
  totalR: number;
  avgR: number | null;
  expectancyR: number | null;
  rWinRate: number;
  pctAbove2R: number;
  pctFullMinus1R: number;
  maxRDrawdown: number;
  rEquityCurve: EquityPoint[];
  rolling: RollingPoint[];
  emotionExpectancyMatrix: EmotionExpectancyRow[];
  confidenceToROutcomeCorrelation: number | null;
  executionToROutcomeCorrelation: number | null;
  checklistToROutcomeCorrelation: number | null;
  /** Emotion ↔ R correlation using ordinal mindset score (always computed, emotion is required) */
  emotionToROutcomeCorrelation: number | null;
  /** Best and worst emotions by avg R, for actionable psychology insights */
  psychologyEmotionInsights: {
    bestEmotion: string | null;
    bestEmotionAvgR: number | null;
    bestEmotionTrades: number;
    worstEmotion: string | null;
    worstEmotionAvgR: number | null;
    worstEmotionTrades: number;
  };
  behavioralWarnings: string[];
  emotionalStreakAnalysis: {
    winStreakEmotions: Record<string, number>;
    lossStreakEmotions: Record<string, number>;
    emotionShiftAfterConsecutiveLosses: Record<string, number>;
  };
  setupPerformanceMatrix: SetupPerformanceRow[];
  sessionTimeAnalysis: {
    bestHour: number | null;
    worstHour: number | null;
    bestTradeNumber: number | null;
    worstTradeNumber: number | null;
    hourExpectancy: Record<number, number>;
    dayOfWeekExpectancy: Record<number, number>;
    sessionExpectancy: Record<string, number>;
    tradeNumberExpectancy: Record<number, number>;
  };
  riskBehavior: {
    averagePlannedRiskPercent: number | null;
    riskVariance: number | null;
    riskAfterLoss: number | null;
    riskAfterWin: number | null;
    riskConsistencyScore: number;
  };
  drawdownReport: DrawdownReport;
  equityComparison: {
    all: EquityPoint[];
    aGradeOnly: EquityPoint[];
    checklist90Plus: EquityPoint[];
    bySetup: Record<string, EquityPoint[]>;
    byEmotion: Record<string, EquityPoint[]>;
  };
  monteCarlo: MonteCarloSummary | null;
  ruleImpact: {
    high: { trades: number; expectancy: number | null };
    medium: { trades: number; expectancy: number | null };
    low: { trades: number; expectancy: number | null };
  };
  disciplineScore: {
    score: number;
    trend: Array<{ index: number; score: number }>;
  };
  weeklyInsights: string[];
}
