import { Trade } from '@/types/trade';

export interface SetupPerformanceRow {
  setupName: string;
  totalTrades: number;
  winRate: number;
  avgR: number | null;
  expectancyR: number | null;
  profitFactor: number | null;
  maxDrawdownR: number;
  percentAbove2R: number;
  percentFullLoss: number;
  averageWinR: number | null;
  averageLossR: number | null;
  rStdDev: number | null;
  reliability: 'Low' | 'Moderate' | 'High';
  confidenceScore: number;
}

export type BehavioralWarningSeverity = 'low' | 'medium' | 'high';

export interface BehavioralWarning {
  type: string;
  severity: BehavioralWarningSeverity;
  message: string;
}

export interface PostLossBehaviorReport {
  riskIncreasePercent: number | null;
  checklistDropPercent: number | null;
  expectancyAfterLoss: number | null;
  overallExpectancy: number | null;
  tradeFrequencySpike: number | null;
  confidenceShift: number | null;
  executionShift: number | null;
  avgRiskAfterLoss: number | null;
  avgRiskOverall: number | null;
  avgChecklistAfterLoss: number | null;
  avgChecklistOverall: number | null;
  avgRAfterLoss: number | null;
  avgROverall: number | null;
  tradeFrequencyAfter2Losses: number | null;
  tradeFrequencyBaseline: number | null;
  behavioralWarnings: BehavioralWarning[];
}

export interface RollingSegment {
  index: number;
  rollingExpectancy: number | null;
  rollingWinRate: number | null;
  rollingAvgR: number | null;
  rollingDrawdown: number | null;
  rollingStdDev: number | null;
}

export type TrendDirection = 'Improving' | 'Deteriorating' | 'Stable';

export interface RollingMetricsResult {
  windowSize: number;
  rollingSeries: RollingSegment[];
  trendDirection: TrendDirection;
}

export interface AdvancedAnalyticsInput {
  trades: Trade[];
  rollingWindowSize?: number;
}

export interface AdvancedAnalyticsResult {
  setupPerformanceMatrix: SetupPerformanceRow[];
  postLossBehavior: PostLossBehaviorReport;
  rollingMetrics: RollingMetricsResult;
}
