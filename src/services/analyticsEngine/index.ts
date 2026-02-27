import { Trade } from '@/types/trade';
import { getEmotionsForTrade } from '@/utils/tradeUtils';
import { applyAnalyticsFilters } from './filters';
import { generateDeterministicInsights } from './insights';
import { runMonteCarloSimulation } from './monteCarlo';
import {
  asDate,
  buildEquityCurve,
  expectancy,
  maxDrawdownFromCurve,
  outcomeR,
  pearsonCorrelation,
  profitFactorFrom,
  toFinite,
  tradeDate,
  winRate,
} from './core';
import { AnalyticsEngineResult, AnalyticsFilterInput, DrawdownReport, RollingPoint, SetupPerformanceRow } from './types';

const groupBy = <T, K extends string | number>(arr: T[], keyFn: (x: T) => K): Record<string, T[]> => {
  return arr.reduce<Record<string, T[]>>((acc, x) => {
    const key = String(keyFn(x));
    (acc[key] ||= []).push(x);
    return acc;
  }, {});
};

const rollingMetrics = (trades: Trade[], windowSize = 20): RollingPoint[] => {
  if (windowSize <= 1) return [];
  const sorted = [...trades].sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime());
  const out: RollingPoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i + 1 < windowSize) continue;
    const slice = sorted.slice(i + 1 - windowSize, i + 1);
    const vals = slice.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
    const curve = vals.reduce<number[]>((acc, v) => {
      acc.push((acc.at(-1) || 0) + v);
      return acc;
    }, []);
    const last = sorted[i];
    out.push({
      index: i,
      tradeId: last.id,
      date: tradeDate(last),
      expectancy: expectancy(vals),
      winRate: vals.length ? winRate(vals) : null,
      avgR: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
      drawdownR: vals.length ? maxDrawdownFromCurve(curve) : null,
    });
  }
  return out;
};

const drawdownReport = (trades: Trade[], initialBalance = 10000): DrawdownReport => {
  const sorted = [...trades].sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime());
  let rEq = 0;
  let pnlEq = initialBalance;
  let peakR = 0;
  let peakP = initialBalance;
  let inDd = false;
  let currentDdDur = 0;
  let longest = 0;
  const ddRs: number[] = [];
  const recovery: number[] = [];
  let recoveryCounter = 0;

  for (const t of sorted) {
    rEq += outcomeR(t) ?? 0;
    pnlEq += toFinite(t.pnl) ?? 0;
    if (rEq >= peakR && inDd) {
      inDd = false;
      recovery.push(recoveryCounter);
      recoveryCounter = 0;
      currentDdDur = 0;
    }
    peakR = Math.max(peakR, rEq);
    peakP = Math.max(peakP, pnlEq);
    const ddR = peakR - rEq;
    if (ddR > 0) {
      inDd = true;
      currentDdDur += 1;
      recoveryCounter += 1;
      longest = Math.max(longest, currentDdDur);
      ddRs.push(ddR);
    } else {
      currentDdDur = 0;
    }
  }

  const maxDdR = ddRs.length ? Math.max(...ddRs) : 0;
  const maxDdPercent = peakP > 0 ? ((maxDdR / peakP) * 100) : 0;
  return {
    maxDrawdownR: maxDdR,
    maxDrawdownPercent: maxDdPercent,
    averageDrawdownR: ddRs.length ? ddRs.reduce((s, v) => s + v, 0) / ddRs.length : 0,
    drawdownFrequency: sorted.length ? ddRs.length / sorted.length : 0,
    longestDrawdownDuration: longest,
    averageRecoveryTrades: recovery.length ? recovery.reduce((s, v) => s + v, 0) / recovery.length : 0,
  };
};

const setupPerformanceMatrix = (trades: Trade[]): SetupPerformanceRow[] => {
  const grouped = groupBy(trades, (t) => (t.setupType || 'Unknown').trim() || 'Unknown');
  return Object.entries(grouped).map(([setupType, rows]) => {
    const vals = rows.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
    const curve = vals.reduce<number[]>((acc, v) => {
      acc.push((acc.at(-1) || 0) + v);
      return acc;
    }, []);
    const n = rows.length;
    return {
      setupType,
      trades: n,
      winRate: vals.length ? winRate(vals) : 0,
      avgR: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
      expectancy: expectancy(vals),
      profitFactor: profitFactorFrom(vals),
      maxDrawdownR: vals.length ? maxDrawdownFromCurve(curve) : null,
      reliability: n < 20 ? 'low' : n <= 50 ? 'medium' : 'high',
    };
  }).sort((a, b) => (b.expectancy ?? -Infinity) - (a.expectancy ?? -Infinity));
};

export const runAnalyticsEngine = (
  trades: Trade[],
  options?: {
    filters?: AnalyticsFilterInput;
    rollingWindow?: number;
    initialBalance?: number;
    monteCarloRuns?: number;
  }
): AnalyticsEngineResult => {
  const filteredTrades = applyAnalyticsFilters(trades, options?.filters);
  const sorted = [...filteredTrades].sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime());
  const rVals = sorted.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
  const rCurve = buildEquityCurve(sorted);
  const rCurveVals = rCurve.map((p) => p.rEquity);

  const totalR = rVals.reduce((s, v) => s + v, 0);
  const avgR = expectancy(rVals);
  const expectancyR = expectancy(rVals);
  const rWinRate = winRate(rVals);
  const pctAbove2R = rVals.length ? (rVals.filter((r) => r > 2).length / rVals.length) * 100 : 0;
  const pctFullMinus1R = rVals.length ? (rVals.filter((r) => r <= -1).length / rVals.length) * 100 : 0;
  const maxRDrawdown = rVals.length ? maxDrawdownFromCurve(rCurveVals) : 0;

  const rolling = rollingMetrics(sorted, options?.rollingWindow ?? 20);

  const expandByEmotion = (trades: Trade[]): Array<{ emotion: string; trade: Trade }> =>
    trades.flatMap((t) => getEmotionsForTrade(t).map((e) => ({ emotion: e, trade: t })));
  const byEmotion = expandByEmotion(sorted).reduce<Record<string, Trade[]>>((acc, { emotion, trade }) => {
    (acc[emotion] ||= []).push(trade);
    return acc;
  }, {});
  const emotionExpectancyMatrix = Object.entries(byEmotion).map(([emotion, rows]) => {
    const vals = rows.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
    const curve = vals.reduce<number[]>((acc, v) => {
      acc.push((acc.at(-1) || 0) + v);
      return acc;
    }, []);
    return {
      emotion,
      trades: rows.length,
      winRate: vals.length ? winRate(vals) : 0,
      avgR: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
      expectancy: expectancy(vals),
      profitFactor: profitFactorFrom(vals),
      maxDrawdownR: vals.length ? maxDrawdownFromCurve(curve) : null,
    };
  }).sort((a, b) => (b.expectancy ?? -Infinity) - (a.expectancy ?? -Infinity));

  const corrInputs = sorted
    .map((t) => ({
      r: outcomeR(t),
      confidence: toFinite(t.confidenceLevel),
      execution: toFinite(t.executionQuality),
      checklist: toFinite(t.checklistCompletionPercent),
    }))
    .filter((x) => x.r !== null);
  const rv = corrInputs.map((x) => x.r as number);
  const confidenceToROutcomeCorrelation = pearsonCorrelation(
    corrInputs.filter((x) => x.confidence !== null).map((x) => x.confidence as number),
    corrInputs.filter((x) => x.confidence !== null).map((x) => x.r as number)
  );
  const executionToROutcomeCorrelation = pearsonCorrelation(
    corrInputs.filter((x) => x.execution !== null).map((x) => x.execution as number),
    corrInputs.filter((x) => x.execution !== null).map((x) => x.r as number)
  );
  const checklistToROutcomeCorrelation = pearsonCorrelation(
    corrInputs.filter((x) => x.checklist !== null).map((x) => x.checklist as number),
    corrInputs.filter((x) => x.checklist !== null).map((x) => x.r as number)
  );

  // Emotion ↔ R: ordinal "mindset quality" score (1–5) based on trading psychology
  const EMOTION_SCORE: Record<string, number> = {
    calm: 5,
    confident: 5,
    satisfied: 4,
    excited: 3,
    nervous: 2,
    frustrated: 1,
    fearful: 1,
    greedy: 1,
    fomo: 1,
    disappointed: 1,
  };
  const emotionScoreFor = (e: string): number => EMOTION_SCORE[e?.toLowerCase()] ?? 3;
  const emotionRInputs = sorted
    .map((t) => {
      const ems = getEmotionsForTrade(t);
      const avgScore = ems.length > 0 ? ems.reduce((s, e) => s + emotionScoreFor(e), 0) / ems.length : 3;
      return { score: avgScore, r: outcomeR(t) };
    })
    .filter((x) => x.r !== null && Number.isFinite(x.r));
  const emotionToROutcomeCorrelation =
    emotionRInputs.length >= 2
      ? pearsonCorrelation(
          emotionRInputs.map((x) => x.score),
          emotionRInputs.map((x) => x.r as number)
        )
      : null;

  // Best/worst emotion by avg R (from expanded by-emotion grouping)
  const emotionMatrix = Object.entries(byEmotion);
  const withAvgR = emotionMatrix
    .map(([emotion, rows]) => {
      const vals = rows.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
      const avgR = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      return { emotion, avgR, trades: rows.length };
    })
    .filter((x) => x.avgR !== null && x.trades >= 1)
    .sort((a, b) => (b.avgR ?? -Infinity) - (a.avgR ?? -Infinity));
  const best = withAvgR[0] ?? null;
  const worst = withAvgR.length > 1 ? withAvgR[withAvgR.length - 1] ?? null : null;
  const psychologyEmotionInsights = {
    bestEmotion: best?.emotion ?? null,
    bestEmotionAvgR: best?.avgR ?? null,
    bestEmotionTrades: best?.trades ?? 0,
    worstEmotion: worst?.emotion ?? null,
    worstEmotionAvgR: worst?.avgR ?? null,
    worstEmotionTrades: worst?.trades ?? 0,
  };

  const behavioralWarnings: string[] = [];
  const riskAfterLossVals: number[] = [];
  const riskAfterWinVals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevPnl = toFinite(prev.pnl) ?? 0;
    const prevRiskPct = toFinite(prev.plannedRiskPercent);
    const currRiskPct = toFinite(curr.plannedRiskPercent);
    if (prevPnl < 0 && currRiskPct !== null) riskAfterLossVals.push(currRiskPct);
    if (prevPnl > 0 && currRiskPct !== null) riskAfterWinVals.push(currRiskPct);
    if (prevPnl < 0 && prevRiskPct !== null && currRiskPct !== null && currRiskPct > prevRiskPct) {
      behavioralWarnings.push(`Risk increased after a loss near ${tradeDate(curr).toISOString().slice(0, 10)}.`);
    }
    if (prevPnl < 0) {
      const prevChecklist = toFinite(prev.checklistCompletionPercent);
      const currChecklist = toFinite(curr.checklistCompletionPercent);
      if (prevChecklist !== null && currChecklist !== null && currChecklist < prevChecklist) {
        behavioralWarnings.push(`Checklist completion dropped after a loss near ${tradeDate(curr).toISOString().slice(0, 10)}.`);
      }
      const prevSize = toFinite(prev.positionSize);
      const currSize = toFinite(curr.positionSize);
      if (prevSize !== null && currSize !== null && currSize > prevSize) {
        behavioralWarnings.push(`Position size increased after a loss near ${tradeDate(curr).toISOString().slice(0, 10)}.`);
      }
    }
  }
  // Overtrading after 2 losses
  for (let i = 2; i < sorted.length; i++) {
    const p1 = toFinite(sorted[i - 1].pnl) ?? 0;
    const p2 = toFinite(sorted[i - 2].pnl) ?? 0;
    if (p1 < 0 && p2 < 0) {
      const tPrev = asDate(sorted[i - 1].entryTime);
      const tCurr = asDate(sorted[i].entryTime);
      if (tPrev && tCurr) {
        const gapHours = (tCurr.getTime() - tPrev.getTime()) / (1000 * 60 * 60);
        if (gapHours <= 2) {
          behavioralWarnings.push(`Trade frequency spiked after two losses near ${tCurr.toISOString().slice(0, 10)}.`);
        }
      }
    }
  }

  const emotionalStreakAnalysis = {
    winStreakEmotions: {} as Record<string, number>,
    lossStreakEmotions: {} as Record<string, number>,
    emotionShiftAfterConsecutiveLosses: {} as Record<string, number>,
  };
  for (let i = 0; i < sorted.length; i++) {
    const pnl = toFinite(sorted[i].pnl) ?? 0;
    getEmotionsForTrade(sorted[i]).forEach((emotion) => {
      if (pnl > 0) emotionalStreakAnalysis.winStreakEmotions[emotion] = (emotionalStreakAnalysis.winStreakEmotions[emotion] || 0) + 1;
      if (pnl < 0) emotionalStreakAnalysis.lossStreakEmotions[emotion] = (emotionalStreakAnalysis.lossStreakEmotions[emotion] || 0) + 1;
      if (i >= 2) {
        const p1 = toFinite(sorted[i - 1].pnl) ?? 0;
        const p2 = toFinite(sorted[i - 2].pnl) ?? 0;
        if (p1 < 0 && p2 < 0) {
          emotionalStreakAnalysis.emotionShiftAfterConsecutiveLosses[emotion] =
            (emotionalStreakAnalysis.emotionShiftAfterConsecutiveLosses[emotion] || 0) + 1;
        }
      }
    });
  }

  const setupPerformance = setupPerformanceMatrix(sorted);

  const byHour: Record<number, number[]> = {};
  const byDay: Record<number, number[]> = {};
  const bySession: Record<string, number[]> = {};
  const byTradeNum: Record<number, number[]> = {};
  for (const t of sorted) {
    const r = outcomeR(t);
    if (r === null) continue;
    const d = tradeDate(t);
    const h = d.getHours();
    const day = d.getDay();
    const s = t.session || 'Other';
    const n = toFinite(t.tradeNumberOfDay);
    (byHour[h] ||= []).push(r);
    (byDay[day] ||= []).push(r);
    (bySession[s] ||= []).push(r);
    if (n !== null) (byTradeNum[n] ||= []).push(r);
  }
  const avgRecord = (rec: Record<string | number, number[]>) =>
    Object.fromEntries(Object.entries(rec).map(([k, vals]) => [Number(k), vals.reduce((s, v) => s + v, 0) / vals.length]));
  const hourExpectancy = avgRecord(byHour) as Record<number, number>;
  const dayOfWeekExpectancy = avgRecord(byDay) as Record<number, number>;
  const sessionExpectancy = Object.fromEntries(Object.entries(bySession).map(([k, vals]) => [k, vals.reduce((s, v) => s + v, 0) / vals.length]));
  const tradeNumberExpectancy = avgRecord(byTradeNum) as Record<number, number>;
  const bestHour = Object.keys(hourExpectancy).length
    ? Number(Object.entries(hourExpectancy).sort((a, b) => b[1] - a[1])[0][0])
    : null;
  const worstHour = Object.keys(hourExpectancy).length
    ? Number(Object.entries(hourExpectancy).sort((a, b) => a[1] - b[1])[0][0])
    : null;
  const bestTradeNumber = Object.keys(tradeNumberExpectancy).length
    ? Number(Object.entries(tradeNumberExpectancy).sort((a, b) => b[1] - a[1])[0][0])
    : null;
  const worstTradeNumber = Object.keys(tradeNumberExpectancy).length
    ? Number(Object.entries(tradeNumberExpectancy).sort((a, b) => a[1] - b[1])[0][0])
    : null;

  const plannedRiskPcts = sorted.map((t) => toFinite(t.plannedRiskPercent)).filter((v): v is number => v !== null);
  const avgRiskPct = plannedRiskPcts.length ? plannedRiskPcts.reduce((s, v) => s + v, 0) / plannedRiskPcts.length : null;
  const riskVariance = plannedRiskPcts.length && avgRiskPct !== null
    ? plannedRiskPcts.reduce((s, v) => s + Math.pow(v - avgRiskPct, 2), 0) / plannedRiskPcts.length
    : null;
  const riskAfterLoss = riskAfterLossVals.length ? riskAfterLossVals.reduce((s, v) => s + v, 0) / riskAfterLossVals.length : null;
  const riskAfterWin = riskAfterWinVals.length ? riskAfterWinVals.reduce((s, v) => s + v, 0) / riskAfterWinVals.length : null;
  const cv = (avgRiskPct && riskVariance != null && avgRiskPct !== 0) ? Math.sqrt(riskVariance) / avgRiskPct : null;
  const riskConsistencyScore = cv === null ? 0 : Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));

  const ddReport = drawdownReport(sorted, options?.initialBalance ?? 10000);
  const allCurve = buildEquityCurve(sorted);
  const aGradeOnly = buildEquityCurve(sorted.filter((t) => t.tradeGrade === 'A'));
  const checklist90Plus = buildEquityCurve(sorted.filter((t) => (toFinite(t.checklistCompletionPercent) ?? -1) >= 90));
  const bySetup = Object.fromEntries(
    Object.entries(groupBy(sorted, (t) => t.setupType || 'Unknown')).map(([k, rows]) => [k, buildEquityCurve(rows)])
  );
  const byEmotionCurves = Object.fromEntries(
    Object.entries(byEmotion).map(([k, rows]) => [k, buildEquityCurve(rows)])
  );

  const monteCarlo = runMonteCarloSimulation(sorted, options?.monteCarloRuns ?? 1000);

  const high = sorted.filter((t) => (toFinite(t.checklistCompletionPercent) ?? -1) >= 90);
  const medium = sorted.filter((t) => {
    const v = toFinite(t.checklistCompletionPercent) ?? -1;
    return v >= 70 && v < 90;
  });
  const low = sorted.filter((t) => (toFinite(t.checklistCompletionPercent) ?? -1) < 70);
  const avg = (rows: Trade[]) => expectancy(rows.map((t) => outcomeR(t)).filter((v): v is number => v !== null));
  const ruleImpact = {
    high: { trades: high.length, expectancy: avg(high) },
    medium: { trades: medium.length, expectancy: avg(medium) },
    low: { trades: low.length, expectancy: avg(low) },
  };

  const emotionalStability =
    Object.values(emotionalStreakAnalysis.lossStreakEmotions).reduce((s, v) => s + v, 0) === 0
      ? 100
      : Math.max(0, 100 - Object.values(emotionalStreakAnalysis.lossStreakEmotions).reduce((s, v) => s + v, 0));
  const adherenceComponent = ruleImpact.high.expectancy != null && ruleImpact.low.expectancy != null
    ? Math.max(0, Math.min(100, 50 + (ruleImpact.high.expectancy - ruleImpact.low.expectancy) * 20))
    : 50;
  const riskComponent = riskConsistencyScore;
  const overtradingPenalty = Math.min(30, behavioralWarnings.filter((w) => w.toLowerCase().includes('frequency')).length * 10);
  const disciplineRaw = (riskComponent * 0.35) + (adherenceComponent * 0.35) + (emotionalStability * 0.3) - overtradingPenalty;
  const disciplineScore = Math.max(0, Math.min(100, Math.round(disciplineRaw)));
  const disciplineTrend = rolling.map((r) => ({
    index: r.index,
    score: Math.max(0, Math.min(100, Math.round((riskComponent * 0.4) + (((r.expectancy ?? 0) + 1) * 20) + ((r.winRate ?? 0) * 0.2)))),
  }));

  const emotionExpectancyMap = Object.fromEntries(
    emotionExpectancyMatrix.map((row) => [row.emotion, row.expectancy])
  );
  const weeklyInsights = generateDeterministicInsights(sorted, {
    overallExpectancyR: expectancyR,
    checklistHighExpectancy: ruleImpact.high.expectancy,
    checklistLowExpectancy: ruleImpact.low.expectancy,
    riskAfterLoss,
    riskAfterWin,
    emotionExpectancy: emotionExpectancyMap,
  });

  return {
    filteredTrades: sorted,
    totalR,
    avgR,
    expectancyR,
    rWinRate,
    pctAbove2R,
    pctFullMinus1R,
    maxRDrawdown,
    rEquityCurve: rCurve,
    rolling,
    emotionExpectancyMatrix,
    confidenceToROutcomeCorrelation,
    executionToROutcomeCorrelation,
    checklistToROutcomeCorrelation,
    emotionToROutcomeCorrelation,
    psychologyEmotionInsights,
    behavioralWarnings: [...new Set(behavioralWarnings)].slice(0, 30),
    emotionalStreakAnalysis,
    setupPerformanceMatrix: setupPerformance,
    sessionTimeAnalysis: {
      bestHour,
      worstHour,
      bestTradeNumber,
      worstTradeNumber,
      hourExpectancy,
      dayOfWeekExpectancy,
      sessionExpectancy,
      tradeNumberExpectancy,
    },
    riskBehavior: {
      averagePlannedRiskPercent: avgRiskPct,
      riskVariance,
      riskAfterLoss,
      riskAfterWin,
      riskConsistencyScore,
    },
    drawdownReport: ddReport,
    equityComparison: {
      all: allCurve,
      aGradeOnly,
      checklist90Plus,
      bySetup,
      byEmotion: byEmotionCurves,
    },
    monteCarlo,
    ruleImpact,
    disciplineScore: {
      score: disciplineScore,
      trend: disciplineTrend,
    },
    weeklyInsights,
  };
};

export * from './types';
export * from './filters';
