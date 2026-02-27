import { Trade } from '@/types/trade';
import { expectancy, outcomeR, toFinite } from './core';

export const generateDeterministicInsights = (
  trades: Trade[],
  options: {
    overallExpectancyR: number | null;
    checklistHighExpectancy: number | null;
    checklistLowExpectancy: number | null;
    riskAfterLoss: number | null;
    riskAfterWin: number | null;
    emotionExpectancy: Record<string, number | null>;
  }
): string[] => {
  const out: string[] = [];
  if (!trades.length) return out;

  const sorted = [...trades].sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
  const rValues = sorted.map((t) => outcomeR(t) ?? 0);

  // If expectancy after 2 wins < overall expectancy
  const after2Wins: number[] = [];
  for (let i = 2; i < rValues.length; i++) {
    if (rValues[i - 1] > 0 && rValues[i - 2] > 0) after2Wins.push(rValues[i]);
  }
  const after2WinsExpectancy = expectancy(after2Wins);
  if (
    options.overallExpectancyR !== null &&
    after2WinsExpectancy !== null &&
    after2WinsExpectancy < options.overallExpectancyR
  ) {
    out.push('Expectancy after two consecutive wins is below your baseline expectancy. Consider post-win discipline rules.');
  }

  if (
    options.riskAfterLoss !== null &&
    options.riskAfterWin !== null &&
    options.riskAfterLoss > options.riskAfterWin
  ) {
    out.push('Risk size tends to increase after losses. This indicates potential revenge-risk behavior.');
  }

  if (
    options.checklistHighExpectancy !== null &&
    options.checklistLowExpectancy !== null &&
    options.checklistHighExpectancy > options.checklistLowExpectancy
  ) {
    out.push('Trades with checklist completion >= 90% outperform low-adherence trades. Keep checklist standards high.');
  }

  const badEmotions = Object.entries(options.emotionExpectancy)
    .filter(([, ex]) => ex !== null && ex < 0)
    .map(([emotion]) => emotion);
  if (badEmotions.length) {
    out.push(`Negative expectancy detected for emotions: ${badEmotions.join(', ')}.`);
  }

  // Overtrading signal
  const lossesInRow = sorted.map((t) => (toFinite(t.pnl) ?? 0) < 0 ? 1 : 0);
  let lossStreak2 = 0;
  for (let i = 1; i < lossesInRow.length; i++) {
    if (lossesInRow[i] === 1 && lossesInRow[i - 1] === 1) lossStreak2++;
  }
  if (lossStreak2 > 0) {
    out.push('Multiple two-loss sequences detected. Consider a mandatory cooldown rule after consecutive losses.');
  }

  return out.slice(0, 8);
};
