import { Trade } from '@/types/trade';
import { outcomeR, toFinite, tradeDate } from './utils';
import { PostLossBehaviorReport, BehavioralWarning } from './types';

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function safePctChange(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / from) * 100;
}

export function calculatePostLossBehavior(trades: Trade[]): PostLossBehaviorReport {
  const warnings: BehavioralWarning[] = [];

  if (!trades || trades.length < 2) {
    return {
      riskIncreasePercent: null,
      checklistDropPercent: null,
      expectancyAfterLoss: null,
      overallExpectancy: null,
      tradeFrequencySpike: null,
      confidenceShift: null,
      executionShift: null,
      avgRiskAfterLoss: null,
      avgRiskOverall: null,
      avgChecklistAfterLoss: null,
      avgChecklistOverall: null,
      avgRAfterLoss: null,
      avgROverall: null,
      tradeFrequencyAfter2Losses: null,
      tradeFrequencyBaseline: null,
      behavioralWarnings: [],
    };
  }

  const sorted = [...trades].sort(
    (a, b) => tradeDate(a).getTime() - tradeDate(b).getTime()
  );

  const rVals = sorted.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
  const wins = rVals.filter((v) => v > 0);
  const losses = rVals.filter((v) => v < 0);
  const winRate = rVals.length > 0 ? wins.length / rVals.length : 0;
  const lossRate = rVals.length > 0 ? losses.length / rVals.length : 0;
  const avgWinR = wins.length > 0 ? avg(wins)! : 0;
  const avgLossRAbs =
    losses.length > 0 ? Math.abs(avg(losses)!) : 0;
  const overallExpectancy = rVals.length > 0
    ? winRate * avgWinR - lossRate * avgLossRAbs
    : null;

  const riskPcts = sorted
    .map((t) => toFinite(t.plannedRiskPercent))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const checklistPcts = sorted
    .map((t) => toFinite(t.checklistCompletionPercent))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const confidenceVals = sorted
    .map((t) => toFinite(t.confidenceLevel))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const execVals = sorted
    .map((t) => toFinite(t.executionQuality))
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const avgRiskOverall = riskPcts.length > 0 ? avg(riskPcts) : null;
  const avgChecklistOverall = checklistPcts.length > 0 ? avg(checklistPcts) : null;
  const avgROverall = rVals.length > 0 ? avg(rVals) : null;

  const afterLossIndices = new Set<number>();
  const after2LossesIndices = new Set<number>();

  let consecutiveLosses = 0;
  for (let i = 0; i < sorted.length; i++) {
    const r = outcomeR(sorted[i]);
    if (r !== null && r < 0) {
      consecutiveLosses++;
      if (i + 1 < sorted.length) afterLossIndices.add(i + 1);
      if (consecutiveLosses >= 2 && i + 1 < sorted.length) {
        after2LossesIndices.add(i + 1);
      }
    } else {
      consecutiveLosses = 0;
    }
  }

  const riskAfterLoss = sorted
    .filter((_, i) => afterLossIndices.has(i))
    .map((t) => toFinite(t.plannedRiskPercent))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const checklistAfterLoss = sorted
    .filter((_, i) => afterLossIndices.has(i))
    .map((t) => toFinite(t.checklistCompletionPercent))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const rAfterLoss = sorted
    .filter((_, i) => afterLossIndices.has(i))
    .map((t) => outcomeR(t))
    .filter((v): v is number => v !== null);

  const avgRiskAfterLoss = riskAfterLoss.length > 0 ? avg(riskAfterLoss) : null;
  const avgChecklistAfterLoss =
    checklistAfterLoss.length > 0 ? avg(checklistAfterLoss) : null;
  const avgRAfterLoss = rAfterLoss.length > 0 ? avg(rAfterLoss) : null;

  const riskIncreasePercent =
    avgRiskOverall !== null && avgRiskAfterLoss !== null
      ? safePctChange(avgRiskOverall, avgRiskAfterLoss)
      : null;

  const checklistDropPercent =
    avgChecklistOverall !== null && avgChecklistAfterLoss !== null
      ? safePctChange(avgChecklistOverall, avgChecklistAfterLoss)
      : null;

  const expectancyAfterLoss =
    rAfterLoss.length > 0
      ? (() => {
          const w = rAfterLoss.filter((v) => v > 0).length;
          const l = rAfterLoss.filter((v) => v < 0).length;
          const wr = w / rAfterLoss.length;
          const lr = l / rAfterLoss.length;
          const aw = w > 0 ? avg(rAfterLoss.filter((v) => v > 0))! : 0;
          const al = l > 0 ? Math.abs(avg(rAfterLoss.filter((v) => v < 0))!) : 0;
          return wr * aw - lr * al;
        })()
      : null;

  const times = sorted.map((t) => tradeDate(t).getTime());
  const timeDiffs: number[] = [];
  for (let i = 1; i < times.length; i++) {
    timeDiffs.push(times[i] - times[i - 1]);
  }
  const avgTimeBetweenBaseline =
    timeDiffs.length > 0 ? avg(timeDiffs)! : 0;

  const after2Indices = [...after2LossesIndices].filter((i) => i > 0);
  const timeDiffsAfter2: number[] = [];
  for (let i = 0; i < after2Indices.length; i++) {
    const idx = after2Indices[i];
    if (idx < times.length - 1) {
      timeDiffsAfter2.push(times[idx + 1] - times[idx]);
    }
  }
  const avgTimeBetweenAfter2 =
    timeDiffsAfter2.length > 0 ? avg(timeDiffsAfter2)! : 0;

  const tradesPerDayBaseline =
    avgTimeBetweenBaseline > 0 ? (24 * 60 * 60 * 1000) / avgTimeBetweenBaseline : null;
  const tradesPerDayAfter2 =
    avgTimeBetweenAfter2 > 0 ? (24 * 60 * 60 * 1000) / avgTimeBetweenAfter2 : null;

  const tradeFrequencySpike =
    tradesPerDayBaseline !== null &&
    tradesPerDayBaseline > 0 &&
    tradesPerDayAfter2 !== null
      ? ((tradesPerDayAfter2 - tradesPerDayBaseline) / tradesPerDayBaseline) * 100
      : null;

  const confidenceAfterLoss = sorted
    .filter((_, i) => afterLossIndices.has(i))
    .map((t) => toFinite(t.confidenceLevel))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const avgConfBaseline =
    confidenceVals.length > 0 ? avg(confidenceVals)! : null;
  const avgConfAfterLoss =
    confidenceAfterLoss.length > 0 ? avg(confidenceAfterLoss)! : null;
  const confidenceShift =
    avgConfBaseline !== null && avgConfAfterLoss !== null
      ? avgConfAfterLoss - avgConfBaseline
      : null;

  const execAfterLoss = sorted
    .filter((_, i) => afterLossIndices.has(i))
    .map((t) => toFinite(t.executionQuality))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const avgExecBaseline = execVals.length > 0 ? avg(execVals)! : null;
  const avgExecAfterLoss = execAfterLoss.length > 0 ? avg(execAfterLoss)! : null;
  const executionShift =
    avgExecBaseline !== null && avgExecAfterLoss !== null
      ? avgExecAfterLoss - avgExecBaseline
      : null;

  if (riskIncreasePercent !== null && riskIncreasePercent > 15) {
    warnings.push({
      type: 'risk_increase',
      severity: riskIncreasePercent > 25 ? 'high' : 'medium',
      message: `Risk increases ${Math.round(riskIncreasePercent)}% after losses.`,
    });
  }

  if (checklistDropPercent !== null && checklistDropPercent < -10) {
    warnings.push({
      type: 'checklist_drop',
      severity: checklistDropPercent < -20 ? 'high' : 'medium',
      message: `Checklist completion drops ${Math.round(Math.abs(checklistDropPercent))}% after losses.`,
    });
  }

  if (tradeFrequencySpike !== null && tradeFrequencySpike > 0) {
    warnings.push({
      type: 'frequency_spike',
      severity: tradeFrequencySpike > 50 ? 'high' : tradeFrequencySpike > 20 ? 'medium' : 'low',
      message: `Trade frequency increases ${Math.round(tradeFrequencySpike)}% after 2+ consecutive losses.`,
    });
  }

  if (
    expectancyAfterLoss !== null &&
    overallExpectancy !== null &&
    expectancyAfterLoss < 0 &&
    overallExpectancy > 0
  ) {
    warnings.push({
      type: 'expectancy_after_loss',
      severity: 'high',
      message: 'Expectancy turns negative after losses while overall expectancy remains positive.',
    });
  }

  if (
    confidenceShift !== null &&
    avgConfBaseline !== null &&
    avgConfBaseline > 0 &&
    confidenceShift < -0.2 * avgConfBaseline
  ) {
    warnings.push({
      type: 'confidence_drop',
      severity: Math.abs(confidenceShift) > 0.5 * avgConfBaseline ? 'high' : 'medium',
      message: 'Confidence drops significantly after losses.',
    });
  }

  return {
    riskIncreasePercent,
    checklistDropPercent,
    expectancyAfterLoss,
    overallExpectancy,
    tradeFrequencySpike,
    confidenceShift,
    executionShift,
    avgRiskAfterLoss,
    avgRiskOverall,
    avgChecklistAfterLoss,
    avgChecklistOverall,
    avgRAfterLoss,
    avgROverall,
    tradeFrequencyAfter2Losses: tradesPerDayAfter2,
    tradeFrequencyBaseline: tradesPerDayBaseline ?? null,
    behavioralWarnings: warnings,
  };
}
