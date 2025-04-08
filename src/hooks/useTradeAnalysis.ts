import { useMemo } from 'react';
import { Trade } from '@/types';

export function useTradeAnalysis(trades: Trade[], initialBalance: number) {
  return useMemo(() => {
    // Basic metrics
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((trade) => trade.profitLoss > 0).length;
    const lossTrades = trades.filter((trade) => trade.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const currentBalance = initialBalance + totalProfitLoss;
    const percentageReturn = initialBalance > 0 ? (totalProfitLoss / initialBalance) * 100 : 0;
    
    // Advanced metrics
    const totalProfit = trades
      .filter((trade) => trade.profitLoss > 0)
      .reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    const totalLoss = trades
      .filter((trade) => trade.profitLoss < 0)
      .reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    const profitFactor = Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : totalProfit;
    
    const avgWin = profitableTrades > 0
      ? totalProfit / profitableTrades
      : 0;
    
    const avgLoss = lossTrades > 0
      ? Math.abs(totalLoss) / lossTrades
      : 0;
    
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;
    
    // Calculate drawdowns
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peak = initialBalance;
    
    const balanceOverTime = trades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, trade, index) => {
        const date = new Date(trade.date).toLocaleDateString();
        const prevBalance = index > 0 ? acc[index - 1].balance : initialBalance;
        const currentBalance = prevBalance + trade.profitLoss;
        
        // Update peak and drawdown
        if (currentBalance > peak) {
          peak = currentBalance;
          currentDrawdown = 0;
        } else {
          currentDrawdown = (peak - currentBalance) / peak * 100;
          if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
          }
        }
        
        acc.push({
          date,
          balance: currentBalance,
          drawdown: currentDrawdown
        });
        
        return acc;
      }, [] as { date: string; balance: number; drawdown: number }[]);
    
    // Generate trade count by date data
    const tradesByDate = trades.reduce((acc, trade) => {
      const date = new Date(trade.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0
        };
      }
      
      acc[date].count += 1;
      
      return acc;
    }, {} as Record<string, { date: string; count: number }>);
    
    const tradeCountByDate = Object.values(tradesByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Show just the last 14 days for a cleaner view
    
    // Analysis by asset
    const assetPerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = {
          asset: trade.asset,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.asset].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.asset].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.asset].losses += 1;
      }
      
      acc[trade.asset].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      asset: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const assetPerformanceArray = Object.values(assetPerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Analysis by trade type
    const tradeTypePerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.tradeType]) {
        acc[trade.tradeType] = {
          type: trade.tradeType,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.tradeType].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.tradeType].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.tradeType].losses += 1;
      }
      
      acc[trade.tradeType].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      type: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const tradeTypePerformanceArray = Object.values(tradeTypePerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Analysis by emotion
    const emotionPerformance = trades.reduce((acc, trade) => {
      if (!trade.emotion) return acc;
      
      if (!acc[trade.emotion]) {
        acc[trade.emotion] = {
          emotion: trade.emotion,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.emotion].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.emotion].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.emotion].losses += 1;
      }
      
      acc[trade.emotion].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      emotion: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const emotionPerformanceArray = Object.values(emotionPerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Time Analysis - Group trades by hour of day
    const tradesByHour = trades.reduce((acc, trade) => {
      const hour = new Date(trade.date).getHours();
      
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[hour].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[hour].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[hour].losses += 1;
      }
      
      acc[hour].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<number, {
      hour: number;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const tradesByHourArray = Object.values(tradesByHour).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
      hourFormatted: `${item.hour}:00`
    }));

    return {
      metrics: {
        totalTrades,
        profitableTrades,
        lossTrades,
        winRate,
        totalProfitLoss,
        totalProfit,
        totalLoss,
        profitFactor,
        avgWin,
        avgLoss,
        riskRewardRatio,
        currentBalance,
        percentageReturn,
        maxDrawdown
      },
      tradeCountByDate,
      assetPerformance: assetPerformanceArray,
      tradeTypePerformance: tradeTypePerformanceArray,
      emotionPerformance: emotionPerformanceArray,
      tradesByHour: tradesByHourArray,
      balanceOverTime,
      winLossData: {
        wins: profitableTrades,
        losses: lossTrades
      }
    };
  }, [trades, initialBalance]);
}
