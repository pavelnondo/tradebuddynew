import { Trade } from '@/types/trade';

export const toFinite = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const asDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const tradeDate = (t: Trade): Date => asDate(t.entryTime) || asDate(t.createdAt) || new Date(0);

export const outcomeR = (t: Trade): number | null => {
  const r = toFinite(t.rMultiple);
  if (r !== null) return r;
  const pnl = toFinite(t.pnl);
  const risk = toFinite(t.plannedRiskAmount);
  if (pnl === null || risk === null || risk <= 0) return null;
  return pnl / risk;
};

export const expectancy = (vals: number[]): number | null => {
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
};

export const winRate = (vals: number[]): number => {
  if (!vals.length) return 0;
  return (vals.filter((v) => v > 0).length / vals.length) * 100;
};

export const profitFactorFrom = (vals: number[]): number | null => {
  const wins = vals.filter((v) => v > 0).reduce((s, v) => s + v, 0);
  const lossesAbs = Math.abs(vals.filter((v) => v < 0).reduce((s, v) => s + v, 0));
  if (lossesAbs <= 0) return wins > 0 ? Number.POSITIVE_INFINITY : null;
  return wins / lossesAbs;
};

export const maxDrawdownFromCurve = (curve: number[]): number => {
  let peak = Number.NEGATIVE_INFINITY;
  let maxDd = 0;
  for (const v of curve) {
    peak = Math.max(peak, v);
    maxDd = Math.max(maxDd, peak - v);
  }
  return maxDd;
};

export const pearsonCorrelation = (x: number[], y: number[]): number | null => {
  if (x.length !== y.length || x.length < 2) return null;
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xv = x[i] - mx;
    const yv = y[i] - my;
    num += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
  }
  const den = Math.sqrt(dx * dy);
  if (den <= 0) return null;
  return num / den;
};

export const buildEquityCurve = (trades: Trade[]) => {
  const sorted = [...trades].sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime());
  let rEq = 0;
  let pnlEq = 0;
  return sorted.map((t, i) => {
    const r = outcomeR(t) ?? 0;
    const pnl = toFinite(t.pnl) ?? 0;
    rEq += r;
    pnlEq += pnl;
    return {
      index: i,
      tradeId: t.id,
      date: tradeDate(t),
      rEquity: Number(rEq.toFixed(6)),
      pnlEquity: Number(pnlEq.toFixed(2)),
    };
  });
};
