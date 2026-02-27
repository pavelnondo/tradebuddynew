import { Trade } from '@/types/trade';
import { getEmotionsForTrade } from '@/utils/tradeUtils';
import { AnalyticsFilterInput } from './types';
import { asDate, outcomeR, toFinite, tradeDate } from './core';

const inRange = (v: number | null, min?: number | null, max?: number | null) => {
  if (v === null) return false;
  if (min != null && v < min) return false;
  if (max != null && v > max) return false;
  return true;
};

export const applyAnalyticsFilters = (trades: Trade[], filters?: AnalyticsFilterInput): Trade[] => {
  if (!filters) return [...trades];
  const start = asDate(filters.startDate);
  const end = asDate(filters.endDate);
  const emotions = (filters.emotions || []).map((e) => e.toLowerCase());
  const setups = (filters.setups || []).map((s) => s.toLowerCase());
  const sessions = new Set(filters.sessions || []);
  const symbols = (filters.symbols || []).map((s) => s.toUpperCase());

  return trades.filter((t) => {
    const dt = tradeDate(t);
    if (start && dt < start) return false;
    if (end && dt > end) return false;

    if (emotions.length) {
      const tradeEmotions = getEmotionsForTrade(t).map((e) => e.toLowerCase());
      if (!tradeEmotions.some((e) => emotions.includes(e))) return false;
    }
    if (setups.length && !setups.includes(String(t.setupType || '').toLowerCase())) return false;
    if (sessions.size && (!t.session || !sessions.has(t.session))) return false;
    if (symbols.length && !symbols.includes(String(t.symbol || '').toUpperCase())) return false;

    const r = outcomeR(t);
    if (filters.rRange && !inRange(r, filters.rRange.min, filters.rRange.max)) return false;

    const riskPct = toFinite(t.plannedRiskPercent);
    if (filters.riskPercentRange && !inRange(riskPct, filters.riskPercentRange.min, filters.riskPercentRange.max)) return false;

    const clPct = toFinite(t.checklistCompletionPercent);
    if (filters.checklistPercentRange && !inRange(clPct, filters.checklistPercentRange.min, filters.checklistPercentRange.max)) return false;

    const conf = toFinite((t as unknown as { confidenceLevel?: number }).confidenceLevel);
    if (filters.confidenceRange && !inRange(conf, filters.confidenceRange.min, filters.confidenceRange.max)) return false;

    const exec = toFinite((t as unknown as { executionQuality?: number }).executionQuality);
    if (filters.executionRange && !inRange(exec, filters.executionRange.min, filters.executionRange.max)) return false;

    const dur = toFinite(t.duration);
    if (filters.durationRange && !inRange(dur, filters.durationRange.min, filters.durationRange.max)) return false;

    const nOfDay = toFinite(t.tradeNumberOfDay);
    if (filters.tradeNumberRange && !inRange(nOfDay, filters.tradeNumberRange.min, filters.tradeNumberRange.max)) return false;

    if (filters.winLoss && filters.winLoss !== 'all') {
      const pnl = toFinite(t.pnl) ?? 0;
      if (filters.winLoss === 'win' && pnl <= 0) return false;
      if (filters.winLoss === 'loss' && pnl >= 0) return false;
      if (filters.winLoss === 'breakeven' && pnl !== 0) return false;
    }

    return true;
  });
};
