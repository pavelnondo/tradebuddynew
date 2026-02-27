import { Trade } from '@/types/trade';
import { MonteCarloSummary } from './types';
import { outcomeR } from './core';

const percentile = (arr: number[], p: number): number => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
};

const shuffle = (arr: number[]): number[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const runMonteCarloSimulation = (
  trades: Trade[],
  simulations = 1000,
  ruinThresholdR = -20
): MonteCarloSummary | null => {
  const rVals = trades.map((t) => outcomeR(t)).filter((v): v is number => v !== null);
  if (!rVals.length) return null;

  const drawdowns: number[] = [];
  const terminalEquities: number[] = [];
  const allCurves: number[][] = [];

  for (let s = 0; s < simulations; s++) {
    const seq = shuffle(rVals);
    let eq = 0;
    let peak = 0;
    let maxDd = 0;
    const curve = new Array(seq.length);
    for (let i = 0; i < seq.length; i++) {
      eq += seq[i];
      peak = Math.max(peak, eq);
      maxDd = Math.max(maxDd, peak - eq);
      curve[i] = eq;
    }
    drawdowns.push(maxDd);
    terminalEquities.push(eq);
    allCurves.push(curve);
  }

  const confidenceBand95 = [];
  for (let i = 0; i < rVals.length; i++) {
    const stepVals = allCurves.map((c) => c[i]);
    confidenceBand95.push({
      step: i + 1,
      lower: percentile(stepVals, 2.5),
      upper: percentile(stepVals, 97.5),
    });
  }

  return {
    simulations,
    worstCaseDrawdownR: Math.max(...drawdowns),
    expectedDrawdownR: drawdowns.reduce((s, v) => s + v, 0) / drawdowns.length,
    riskOfRuinProbability: terminalEquities.filter((v) => v <= ruinThresholdR).length / terminalEquities.length,
    confidenceBand95,
  };
};
