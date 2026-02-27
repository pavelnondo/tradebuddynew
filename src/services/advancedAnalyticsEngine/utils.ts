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

export const tradeDate = (t: Trade): Date =>
  asDate(t.entryTime) || asDate((t as { createdAt?: unknown }).createdAt) || new Date(0);

export const outcomeR = (t: Trade): number | null => {
  const r = toFinite(t.rMultiple);
  if (r !== null) return r;
  const pnl = toFinite(t.pnl);
  const risk = toFinite(t.plannedRiskAmount);
  if (pnl === null || risk === null || risk <= 0) return null;
  return pnl / risk;
};

export const safeDivide = (a: number, b: number): number | null =>
  b === 0 ? null : a / b;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const round4 = (n: number): number => Math.round(n * 10000) / 10000;

export const stdDev = (vals: number[]): number | null => {
  if (vals.length < 2) return null;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
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
