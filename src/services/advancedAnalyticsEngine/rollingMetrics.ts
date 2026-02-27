import { Trade } from '@/types/trade';
import { outcomeR, tradeDate } from './utils';
import { stdDev, maxDrawdownFromCurve } from './utils';
import { RollingMetricsResult, RollingSegment, TrendDirection } from './types';

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function calculateRollingMetrics(
  trades: Trade[],
  windowSize: number = 20
): RollingMetricsResult {
  const series: RollingSegment[] = [];

  if (!trades || trades.length === 0) {
    return {
      windowSize,
      rollingSeries: [],
      trendDirection: 'Stable',
    };
  }

  const sorted = [...trades].sort(
    (a, b) => tradeDate(a).getTime() - tradeDate(b).getTime()
  );

  const rVals = sorted
    .map((t) => outcomeR(t))
    .map((v) => (v !== null && Number.isFinite(v) ? v : 0));

  if (rVals.length === 0) {
    return { windowSize, rollingSeries: [], trendDirection: 'Stable' };
  }

  const effectiveWindow = Math.min(windowSize, rVals.length);

  for (let i = effectiveWindow - 1; i < rVals.length; i++) {
    const window = rVals.slice(i - effectiveWindow + 1, i + 1);
    const wins = window.filter((v) => v > 0);
    const losses = window.filter((v) => v < 0);

    const rollingExpectancy =
      wins.length > 0 || losses.length > 0
        ? (() => {
            const wr = wins.length / window.length;
            const lr = losses.length / window.length;
            const aw = wins.length > 0 ? wins.reduce((s, v) => s + v, 0) / wins.length : 0;
            const al =
              losses.length > 0
                ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length)
                : 0;
            return round4(wr * aw - lr * al);
          })()
        : null;

    const rollingWinRate =
      window.length > 0
        ? round4((wins.length / window.length) * 100)
        : null;

    const rollingAvgR =
      window.length > 0
        ? round4(window.reduce((s, v) => s + v, 0) / window.length)
        : null;

    const curve = window.reduce<number[]>((acc, v) => {
      acc.push((acc.at(-1) ?? 0) + v);
      return acc;
    }, []);
    const rollingDrawdown = round4(maxDrawdownFromCurve(curve));

    const rollingStdDev = stdDev(window);
    const rollingStdDevRounded = rollingStdDev !== null ? round4(rollingStdDev) : null;

    series.push({
      index: i,
      rollingExpectancy,
      rollingWinRate,
      rollingAvgR,
      rollingDrawdown,
      rollingStdDev: rollingStdDevRounded,
    });
  }

  let trendDirection: TrendDirection = 'Stable';
  const expVals = series
    .map((s) => s.rollingExpectancy)
    .filter((v): v is number => v !== null);
  if (expVals.length >= 3) {
    const last3 = expVals.slice(-3);
    const inc = last3[0]! < last3[1]! && last3[1]! < last3[2]!;
    const dec = last3[0]! > last3[1]! && last3[1]! > last3[2]!;
    if (inc) trendDirection = 'Improving';
    else if (dec) trendDirection = 'Deteriorating';
  }

  return {
    windowSize,
    rollingSeries: series,
    trendDirection,
  };
}
