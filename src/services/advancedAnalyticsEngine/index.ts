import { Trade } from '@/types/trade';
import { calculateSetupPerformanceMatrix } from './setupPerformanceMatrix';
import { calculatePostLossBehavior } from './postLossBehavior';
import { calculateRollingMetrics } from './rollingMetrics';
import type { AdvancedAnalyticsInput, AdvancedAnalyticsResult } from './types';

export * from './types';
export { calculateSetupPerformanceMatrix } from './setupPerformanceMatrix';
export { calculatePostLossBehavior } from './postLossBehavior';
export { calculateRollingMetrics } from './rollingMetrics';

const DEFAULT_ROLLING_WINDOW = 20;

/**
 * Advanced analytics engine. Accepts filtered trades and returns structured analytics.
 * Null-safe, optimized for 1000+ trades. Independent from UI.
 */
export function computeAdvancedAnalytics(
  input: AdvancedAnalyticsInput
): AdvancedAnalyticsResult {
  const { trades, rollingWindowSize = DEFAULT_ROLLING_WINDOW } = input;
  const safeTrades = Array.isArray(trades) ? trades : [];

  return {
    setupPerformanceMatrix: calculateSetupPerformanceMatrix(safeTrades),
    postLossBehavior: calculatePostLossBehavior(safeTrades),
    rollingMetrics: calculateRollingMetrics(safeTrades, rollingWindowSize),
  };
}
