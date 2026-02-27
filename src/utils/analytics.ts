/**
 * Analytics calculation utilities
 * All trade analytics calculations in one place
 */

import { Trade, Emotion, TradeType } from '@/types/trade';
import { getEmotionsForTrade } from './tradeUtils';

export interface TradeAnalytics {
  // Basic metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  maxWin: number;
  maxLoss: number;
  
  // Advanced metrics
  profitFactor: number;
  expectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  
  // Streaks
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  
  // Equity curve
  equityCurve: Array<{ date: Date; equity: number; pnl: number }>;
  
  // Distribution
  tradesByEmotion: Record<Emotion, number>;
  tradesByType: Record<TradeType, number>;
  tradesBySymbol: Record<string, number>;
  tradesBySetup: Record<string, number>;
  
  // Time analysis
  tradesByHour: Record<number, { count: number; totalPnL: number; winRate: number }>;
  tradesByDayOfWeek: Record<number, { count: number; totalPnL: number; winRate: number; wins: number; losses: number }>;
  
  // Emotion performance
  emotionPerformance: Array<{
    emotion: Emotion;
    count: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnL: number;
    averagePnL: number;
  }>;
  
  // R/R analysis
  riskRewardData: Array<{
    tradeId: string;
    symbol: string;
    rr: number;
    pnl: number;
    pnlPercent: number;
  }>;
  
  // New analytics for improved charts
  emotionOutcomeData: Array<{
    emotion: Emotion;
    outcome: 'Win' | 'Loss' | 'Break-even';
    count: number;
    avgPnL: number;
    winRate: number;
    avgR: number;
  }>;
  
  hourlyPerformanceData: Array<{
    hour: number;
    avgR: number;
    winRate: number;
    tradeCount: number;
    totalPnL: number;
  }>;
  
  dayOfWeekDistribution: Array<{
    day: number;
    dayName: string;
    trades: number[];
    avgR: number;
    medianR: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
  }>;
  
  rMultipleDistribution: Array<{
    bin: string;
    rMultiple: number;
    count: number;
    isWin: boolean;
    avgR: number;
  }>;
  
  rMultipleBuckets: Array<{
    bucket: string;
    count: number;
    percentage: number;
    avgR: number;
    totalPnL: number;
  }>;

  /** Checklist completion statistics (pre, during, post) */
  checklistCompletion: {
    pre: { tradeCount: number; totalItems: number; completedItems: number; completionRate: number };
    during: { tradeCount: number; totalItems: number; completedItems: number; completionRate: number };
    post: { tradeCount: number; totalItems: number; completedItems: number; completionRate: number };
  };

  /** Setup grade (A, B, C) performance statistics */
  gradePerformance: Array<{
    grade: string;
    trades: number;
    wins: number;
    winRate: number;
    totalPnL: number;
  }>;
}

/**
 * Calculate comprehensive trade analytics
 */
export function calculateAnalytics(trades: Trade[], initialBalance: number = 10000): TradeAnalytics {
  if (!Array.isArray(trades) || trades.length === 0) {
    return getEmptyAnalytics(initialBalance);
  }

  // Sort trades by entry time
  const sortedTrades = [...trades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
  );

  // Basic metrics
  const winningTrades = sortedTrades.filter((t) => t.pnl > 0);
  const losingTrades = sortedTrades.filter((t) => t.pnl < 0);
  const breakEvenTrades = sortedTrades.filter((t) => t.pnl === 0);
  
  const totalTrades = sortedTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const totalPnL = sortedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
  
  const maxWin = Math.max(...sortedTrades.map((t) => t.pnl), 0);
  const maxLoss = Math.min(...sortedTrades.map((t) => t.pnl), 0);

  // Advanced metrics
  const totalWins = winningTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  
  const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;
  
  // Sharpe ratio approximation (simplified)
  const returns = sortedTrades.map((t) => t.pnlPercent);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Max drawdown
  let equity = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  // Initial point: use 1 day before first trade so it doesn't collide with first trade's date
  const firstTradeDate = sortedTrades[0]?.entryTime || new Date();
  const initialDate = new Date(firstTradeDate.getTime() - 24 * 60 * 60 * 1000);
  const equityCurve: Array<{ date: Date; equity: number; pnl: number }> = [
    { date: initialDate, equity: initialBalance, pnl: 0 },
  ];

  let lastDateMs = initialDate.getTime();
  sortedTrades.forEach((trade) => {
    equity += trade.pnl;
    if (equity > peak) peak = equity;
    const drawdown = ((peak - equity) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    const rawDate = trade.exitTime || trade.entryTime;
    let dateMs = rawDate instanceof Date ? rawDate.getTime() : new Date(rawDate).getTime();
    if (dateMs <= lastDateMs) dateMs = lastDateMs + 1;
    lastDateMs = dateMs;
    equityCurve.push({
      date: new Date(dateMs),
      equity,
      pnl: trade.pnl,
    });
  });

  const recoveryFactor = maxDrawdown > 0 ? (totalPnL / maxDrawdown) * 100 : 0;

  // Streaks
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  sortedTrades.forEach((trade) => {
    if (trade.pnl > 0) {
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
    } else if (trade.pnl < 0) {
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
    } else {
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  });

  currentWinStreak = tempWinStreak;
  currentLossStreak = tempLossStreak;

  // Distribution
  const tradesByEmotion: Record<string, number> = {};
  const tradesByType: Record<string, number> = {};
  const tradesBySymbol: Record<string, number> = {};
  const tradesBySetup: Record<string, number> = {};

  sortedTrades.forEach((trade) => {
    tradesByEmotion[trade.emotion] = (tradesByEmotion[trade.emotion] || 0) + 1;
    tradesByType[trade.type] = (tradesByType[trade.type] || 0) + 1;
    tradesBySymbol[trade.symbol] = (tradesBySymbol[trade.symbol] || 0) + 1;
    if (trade.setupType) {
      tradesBySetup[trade.setupType] = (tradesBySetup[trade.setupType] || 0) + 1;
    }
  });

  // Time analysis
  const tradesByHour: Record<number, { count: number; totalPnL: number; wins: number }> = {};
  const tradesByDayOfWeek: Record<number, { count: number; totalPnL: number; wins: number }> = {};

  sortedTrades.forEach((trade) => {
    const hour = trade.entryTime.getHours();
    const dayOfWeek = trade.entryTime.getDay();

    // By hour
    if (!tradesByHour[hour]) {
      tradesByHour[hour] = { count: 0, totalPnL: 0, wins: 0 };
    }
    tradesByHour[hour].count++;
    tradesByHour[hour].totalPnL += trade.pnl;
    if (trade.pnl > 0) tradesByHour[hour].wins++;

    // By day of week
    if (!tradesByDayOfWeek[dayOfWeek]) {
      tradesByDayOfWeek[dayOfWeek] = { count: 0, totalPnL: 0, wins: 0 };
    }
    tradesByDayOfWeek[dayOfWeek].count++;
    tradesByDayOfWeek[dayOfWeek].totalPnL += trade.pnl;
    if (trade.pnl > 0) tradesByDayOfWeek[dayOfWeek].wins++;
  });

  // Convert to win rates
  const tradesByHourWithWinRate: Record<number, { count: number; totalPnL: number; winRate: number }> = {};
  Object.entries(tradesByHour).forEach(([hour, data]) => {
    tradesByHourWithWinRate[Number(hour)] = {
      count: data.count,
      totalPnL: data.totalPnL,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    };
  });

  const tradesByDayOfWeekWithWinRate: Record<number, { count: number; totalPnL: number; winRate: number; wins: number; losses: number }> = {};
  Object.entries(tradesByDayOfWeek).forEach(([day, data]) => {
    tradesByDayOfWeekWithWinRate[Number(day)] = {
      count: data.count,
      totalPnL: data.totalPnL,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      wins: data.wins,
      losses: data.count - data.wins,
    };
  });

  // Emotion performance (multi-emotion: trade counts toward each selected emotion)
  const emotionPerformanceMap: Record<string, { count: number; wins: number; totalPnL: number }> = {};
  sortedTrades.forEach((trade) => {
    getEmotionsForTrade(trade).forEach((emotion) => {
      if (!emotionPerformanceMap[emotion]) {
        emotionPerformanceMap[emotion] = { count: 0, wins: 0, totalPnL: 0 };
      }
      emotionPerformanceMap[emotion].count++;
      if (trade.pnl > 0) emotionPerformanceMap[emotion].wins++;
      emotionPerformanceMap[emotion].totalPnL += trade.pnl;
    });
  });

  const emotionPerformance = Object.entries(emotionPerformanceMap).map(([emotion, data]) => ({
    emotion: emotion as Emotion,
    count: data.count,
    wins: data.wins,
    losses: data.count - data.wins,
    winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    totalPnL: data.totalPnL,
    averagePnL: data.count > 0 ? data.totalPnL / data.count : 0,
  }));

  // R/R analysis
  const riskRewardData = sortedTrades
    .filter((t) => t.rr !== null && t.rr !== undefined)
    .map((trade) => ({
      tradeId: trade.id,
      symbol: trade.symbol,
      rr: trade.rr!,
      pnl: trade.pnl,
      pnlPercent: trade.pnlPercent,
    }));

  // Avg R-multiple (Emotion vs Outcome): per trade we compute R = P&L / Risk.
  // Risk = average loss of all losing trades (or $100 fallback). Wins get positive R, losses negative.
  // Per cell we then show: avg R = sum of those R values / count.
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
    : Math.abs(averagePnL) || 100; // Fallback to $100 if no losses
  
  const calculateRMultiple = (trade: Trade): number => {
    if (trade.rr != null && trade.rr > 0 && trade.pnl > 0) return trade.rr;
    return avgLoss > 0 ? trade.pnl / avgLoss : 0;
  };

  const tradesWithR = sortedTrades.map(trade => ({
    ...trade,
    rMultiple: calculateRMultiple(trade),
  }));

  // Emotion vs Outcome Heatmap data (multi-emotion: trade counts toward each)
  const emotionOutcomeMap: Record<string, Record<string, { count: number; totalPnL: number; totalR: number }>> = {};
  tradesWithR.forEach((trade) => {
    const outcome = trade.pnl > 0 ? 'Win' : trade.pnl < 0 ? 'Loss' : 'Break-even';
    getEmotionsForTrade(trade).forEach((emotion) => {
      if (!emotionOutcomeMap[emotion]) emotionOutcomeMap[emotion] = {};
      if (!emotionOutcomeMap[emotion][outcome]) {
        emotionOutcomeMap[emotion][outcome] = { count: 0, totalPnL: 0, totalR: 0 };
      }
      emotionOutcomeMap[emotion][outcome].count++;
      emotionOutcomeMap[emotion][outcome].totalPnL += trade.pnl;
      emotionOutcomeMap[emotion][outcome].totalR += trade.rMultiple;
    });
  });

  const emotionOutcomeData = Object.entries(emotionOutcomeMap).flatMap(([emotion, outcomes]) =>
    Object.entries(outcomes).map(([outcome, data]) => ({
      emotion: emotion as Emotion,
      outcome: outcome as 'Win' | 'Loss' | 'Break-even',
      count: data.count,
      avgPnL: data.count > 0 ? data.totalPnL / data.count : 0,
      winRate: outcome === 'Win' ? 100 : 0, // Will be calculated per emotion
      avgR: data.count > 0 ? data.totalR / data.count : 0,
    }))
  );

  // Calculate win rates per emotion
  const emotionWinRates: Record<string, number> = {};
  Object.entries(emotionPerformanceMap).forEach(([emotion, data]) => {
    emotionWinRates[emotion] = data.count > 0 ? (data.wins / data.count) * 100 : 0;
  });
  emotionOutcomeData.forEach(item => {
    item.winRate = emotionWinRates[item.emotion] || 0;
  });

  // Hourly Performance Heatmap data
  const hourlyPerformanceMap: Record<number, { trades: number[]; totalPnL: number; wins: number }> = {};
  tradesWithR.forEach((trade) => {
    const hour = trade.entryTime.getHours();
    if (!hourlyPerformanceMap[hour]) {
      hourlyPerformanceMap[hour] = { trades: [], totalPnL: 0, wins: 0 };
    }
    hourlyPerformanceMap[hour].trades.push(trade.rMultiple);
    hourlyPerformanceMap[hour].totalPnL += trade.pnl;
    if (trade.pnl > 0) hourlyPerformanceMap[hour].wins++;
  });

  const hourlyPerformanceData = Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyPerformanceMap[hour] || { trades: [], totalPnL: 0, wins: 0 };
    const avgR = data.trades.length > 0 
      ? data.trades.reduce((sum, r) => sum + r, 0) / data.trades.length 
      : 0;
    const winRate = data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0;
    return {
      hour,
      avgR,
      winRate,
      tradeCount: data.trades.length,
      totalPnL: data.totalPnL,
    };
  });

  // Day of Week Box Plot data
  const dayOfWeekMap: Record<number, number[]> = {};
  tradesWithR.forEach((trade) => {
    const day = trade.entryTime.getDay();
    if (!dayOfWeekMap[day]) {
      dayOfWeekMap[day] = [];
    }
    dayOfWeekMap[day].push(trade.rMultiple);
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { avg: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
    const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    return {
      avg: avg,
      median: median,
      q1: q1,
      q3: q3,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  };

  const dayOfWeekDistribution = Array.from({ length: 7 }, (_, day) => {
    const values = dayOfWeekMap[day] || [];
    const stats = calculateStats(values);
    return {
      day,
      dayName: dayNames[day],
      trades: values,
      avgR: stats.avg,
      medianR: stats.median,
      q1: stats.q1,
      q3: stats.q3,
      min: stats.min,
      max: stats.max,
    };
  });

  // R-Multiple Expectancy Distribution
  const rBins: Record<string, { wins: number[]; losses: number[] }> = {};
  tradesWithR.forEach((trade) => {
    const r = trade.rMultiple;
    let bin = '';
    if (r <= -2) bin = '≤-2R';
    else if (r <= -1) bin = '-2R to -1R';
    else if (r < 0) bin = '-1R to 0';
    else if (r < 1) bin = '0 to +1R';
    else if (r < 2) bin = '+1R to +2R';
    else bin = '>+2R';
    
    if (!rBins[bin]) {
      rBins[bin] = { wins: [], losses: [] };
    }
    if (trade.pnl > 0) {
      rBins[bin].wins.push(r);
    } else if (trade.pnl < 0) {
      rBins[bin].losses.push(r);
    }
  });

  const rMultipleDistribution = Object.entries(rBins).flatMap(([bin, data]) => [
    ...data.wins.map(r => ({
      bin,
      rMultiple: r,
      count: 1,
      isWin: true,
      avgR: r,
    })),
    ...data.losses.map(r => ({
      bin,
      rMultiple: r,
      count: 1,
      isWin: false,
      avgR: r,
    })),
  ]);

  // Checklist completion statistics (pre, during, post)
  const checklistPre = { tradeCount: 0, totalItems: 0, completedItems: 0 };
  const checklistDuring = { tradeCount: 0, totalItems: 0, completedItems: 0 };
  const checklistPost = { tradeCount: 0, totalItems: 0, completedItems: 0 };
  sortedTrades.forEach((trade) => {
    const pre = trade.checklistItems ?? [];
    const dur = trade.duringChecklistItems ?? [];
    const post = trade.postChecklistItems ?? [];
    if (Array.isArray(pre) && pre.length > 0) {
      checklistPre.tradeCount++;
      checklistPre.totalItems += pre.length;
      checklistPre.completedItems += pre.filter((i: { completed?: boolean }) => i.completed).length;
    }
    if (Array.isArray(dur) && dur.length > 0) {
      checklistDuring.tradeCount++;
      checklistDuring.totalItems += dur.length;
      checklistDuring.completedItems += dur.filter((i: { completed?: boolean }) => i.completed).length;
    }
    if (Array.isArray(post) && post.length > 0) {
      checklistPost.tradeCount++;
      checklistPost.totalItems += post.length;
      checklistPost.completedItems += post.filter((i: { completed?: boolean }) => i.completed).length;
    }
  });
  const checklistCompletion = {
    pre: {
      ...checklistPre,
      completionRate: checklistPre.totalItems > 0
        ? Math.round((checklistPre.completedItems / checklistPre.totalItems) * 10000) / 100
        : 0,
    },
    during: {
      ...checklistDuring,
      completionRate: checklistDuring.totalItems > 0
        ? Math.round((checklistDuring.completedItems / checklistDuring.totalItems) * 10000) / 100
        : 0,
    },
    post: {
      ...checklistPost,
      completionRate: checklistPost.totalItems > 0
        ? Math.round((checklistPost.completedItems / checklistPost.totalItems) * 10000) / 100
        : 0,
    },
  };

  // Setup grade (A, B, C) performance
  const gradeOrder = ['A', 'B', 'C'];
  const gradeStats = sortedTrades
    .filter((t) => t.tradeGrade && gradeOrder.includes(String(t.tradeGrade).toUpperCase()))
    .reduce((acc: Record<string, { trades: number; wins: number; totalPnL: number }>, trade) => {
      const grade = String(trade.tradeGrade).toUpperCase();
      if (!acc[grade]) acc[grade] = { trades: 0, wins: 0, totalPnL: 0 };
      acc[grade].trades++;
      if (trade.pnl > 0) acc[grade].wins++;
      acc[grade].totalPnL += trade.pnl;
      return acc;
    }, {});
  const gradePerformance = gradeOrder
    .map((grade) => ({
      grade,
      trades: gradeStats[grade]?.trades ?? 0,
      wins: gradeStats[grade]?.wins ?? 0,
      winRate: (gradeStats[grade]?.trades ?? 0) > 0
        ? (gradeStats[grade]!.wins / gradeStats[grade]!.trades) * 100
        : 0,
      totalPnL: gradeStats[grade]?.totalPnL ?? 0,
    }))
    .filter((g) => g.trades > 0);

  // R-Multiple Outcome Buckets
  const bucketRanges = [
    { label: '≤-1R', min: -Infinity, max: -1 },
    { label: '-1R to 0', min: -1, max: 0 },
    { label: '0 to +1R', min: 0, max: 1 },
    { label: '+1R to +2R', min: 1, max: 2 },
    { label: '>+2R', min: 2, max: Infinity },
  ];

  const rMultipleBuckets = bucketRanges.map(({ label, min, max }) => {
    const tradesInBucket = tradesWithR.filter(t => t.rMultiple > min && t.rMultiple <= max);
    const count = tradesInBucket.length;
    const percentage = totalTrades > 0 ? (count / totalTrades) * 100 : 0;
    const avgR = count > 0 
      ? tradesInBucket.reduce((sum, t) => sum + t.rMultiple, 0) / count 
      : 0;
    const totalPnL = tradesInBucket.reduce((sum, t) => sum + t.pnl, 0);
    return {
      bucket: label,
      count,
      percentage,
      avgR,
      totalPnL,
    };
  });

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    winRate: Math.round(winRate * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    averagePnL: Math.round(averagePnL * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    equityCurve,
    tradesByEmotion: tradesByEmotion as Record<Emotion, number>,
    tradesByType: tradesByType as Record<TradeType, number>,
    tradesBySymbol,
    tradesBySetup,
    tradesByHour: tradesByHourWithWinRate,
    tradesByDayOfWeek: tradesByDayOfWeekWithWinRate,
    emotionPerformance,
    riskRewardData,
    emotionOutcomeData,
    hourlyPerformanceData,
    dayOfWeekDistribution,
    rMultipleDistribution,
    rMultipleBuckets,
    checklistCompletion,
    gradePerformance,
  };
}

/** Monthly comparison: this month vs last month P&L and trade counts */
export function getMonthlyComparison(trades: Trade[]): {
  thisMonthPnL: number;
  lastMonthPnL: number;
  thisMonthTrades: number;
  lastMonthTrades: number;
  pnlChange: number;
  tradesChange: number;
} {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      thisMonthPnL: 0,
      lastMonthPnL: 0,
      thisMonthTrades: 0,
      lastMonthTrades: 0,
      pnlChange: 0,
      tradesChange: 0,
    };
  }
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let thisMonthPnL = 0;
  let lastMonthPnL = 0;
  let thisMonthTrades = 0;
  let lastMonthTrades = 0;

  trades.forEach((t) => {
    const d = t.exitTime || t.entryTime;
    const y = d.getFullYear();
    const m = d.getMonth();
    if (y === thisYear && m === thisMonth) {
      thisMonthPnL += t.pnl;
      thisMonthTrades++;
    } else if (y === lastMonthYear && m === lastMonth) {
      lastMonthPnL += t.pnl;
      lastMonthTrades++;
    }
  });

  return {
    thisMonthPnL: Math.round(thisMonthPnL * 100) / 100,
    lastMonthPnL: Math.round(lastMonthPnL * 100) / 100,
    thisMonthTrades,
    lastMonthTrades,
    pnlChange: Math.round((thisMonthPnL - lastMonthPnL) * 100) / 100,
    tradesChange: thisMonthTrades - lastMonthTrades,
  };
}

function getEmptyAnalytics(initialBalance: number = 10000): TradeAnalytics {
  const now = new Date();
  return {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    breakEvenTrades: 0,
    winRate: 0,
    totalPnL: 0,
    averagePnL: 0,
    maxWin: 0,
    maxLoss: 0,
    profitFactor: 0,
    expectancy: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    recoveryFactor: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    equityCurve: [{ date: now, equity: initialBalance, pnl: 0 }],
    tradesByEmotion: {} as Record<Emotion, number>,
    tradesByType: {} as Record<TradeType, number>,
    tradesBySymbol: {},
    tradesBySetup: {},
    tradesByHour: {},
    tradesByDayOfWeek: {},
    emotionPerformance: [],
    riskRewardData: [],
    emotionOutcomeData: [],
    hourlyPerformanceData: [],
    dayOfWeekDistribution: [],
    rMultipleDistribution: [],
    rMultipleBuckets: [],
    checklistCompletion: {
      pre: { tradeCount: 0, totalItems: 0, completedItems: 0, completionRate: 0 },
      during: { tradeCount: 0, totalItems: 0, completedItems: 0, completionRate: 0 },
      post: { tradeCount: 0, totalItems: 0, completedItems: 0, completionRate: 0 },
    },
    gradePerformance: [],
  };
}

