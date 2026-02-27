import { Trade } from '@/types/trade';
import {
  outcomeR,
  toFinite,
  tradeDate,
  safeDivide,
  round2,
  round4,
  stdDev,
  maxDrawdownFromCurve,
} from './utils';
import { SetupPerformanceRow } from './types';

const groupBy = <T>(arr: T[], keyFn: (x: T) => string): Record<string, T[]> => {
  return arr.reduce<Record<string, T[]>>((acc, x) => {
    const key = keyFn(x);
    (acc[key] ||= []).push(x);
    return acc;
  }, {});
};

export function calculateSetupPerformanceMatrix(trades: Trade[]): SetupPerformanceRow[] {
  if (!trades || trades.length === 0) return [];

  const sorted = [...trades].sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime());
  const groups = groupBy(sorted, (t) => (t.setupType && String(t.setupType).trim()) || 'Unspecified');

  const rows: SetupPerformanceRow[] = [];

  for (const [setupName, setupTrades] of Object.entries(groups)) {
    if (!setupTrades.length) continue;

    const rVals = setupTrades
      .map((t) => outcomeR(t))
      .filter((v): v is number => v !== null && Number.isFinite(v));

    const wins = rVals.filter((v) => v > 0);
    const losses = rVals.filter((v) => v < 0);
    const totalTrades = setupTrades.length;
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = totalTrades > 0 ? round2((winCount / totalTrades) * 100) : 0;
    const lossRate = totalTrades > 0 ? round2((lossCount / totalTrades) * 100) : 0;

    const avgR =
      rVals.length > 0
        ? round4(rVals.reduce((s, v) => s + v, 0) / rVals.length)
        : null;

    const averageWinR =
      wins.length > 0
        ? round4(wins.reduce((s, v) => s + v, 0) / wins.length)
        : null;

    const averageLossR =
      losses.length > 0
        ? round4(Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length))
        : null;

    const expectancyR =
      averageWinR !== null && averageLossR !== null
        ? round4(winRate / 100 * averageWinR - lossRate / 100 * averageLossR)
        : avgR;

    const sumPosR = rVals.filter((v) => v > 0).reduce((s, v) => s + v, 0);
    const sumNegRAbs = Math.abs(rVals.filter((v) => v < 0).reduce((s, v) => s + v, 0));
    const profitFactor =
      sumNegRAbs > 0 ? round4(sumPosR / sumNegRAbs) : sumPosR > 0 ? 999.9999 : null;

    const curve = rVals.reduce<number[]>((acc, v) => {
      acc.push((acc.at(-1) ?? 0) + v);
      return acc;
    }, []);
    const maxDrawdownR = round4(maxDrawdownFromCurve(curve));

    const percentAbove2R =
      rVals.length > 0
        ? round2((rVals.filter((v) => v >= 2).length / rVals.length) * 100)
        : 0;

    const percentFullLoss =
      rVals.length > 0
        ? round2((rVals.filter((v) => v <= -0.99).length / rVals.length) * 100)
        : 0;

    const rStdDev = stdDev(rVals);
    const rStdDevRounded = rStdDev !== null ? round4(rStdDev) : null;

    let reliability: 'Low' | 'Moderate' | 'High' = 'Low';
    if (totalTrades >= 50) reliability = 'High';
    else if (totalTrades >= 20) reliability = 'Moderate';

    const confidenceScore = Math.min(100, totalTrades * 2);

    rows.push({
      setupName,
      totalTrades,
      winRate,
      avgR,
      expectancyR: expectancyR ?? null,
      profitFactor,
      maxDrawdownR,
      percentAbove2R,
      percentFullLoss,
      averageWinR,
      averageLossR,
      rStdDev: rStdDevRounded,
      reliability,
      confidenceScore,
    });
  }

  return rows.sort((a, b) => (b.expectancyR ?? -Infinity) - (a.expectancyR ?? -Infinity));
}
