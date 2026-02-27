import { useMemo } from 'react';
import { Trade } from '@/types/trade';

export function useTradeAnalysis(trades: Trade[], initialBalance: number) {
  return useMemo(() => {
    // Ensure trades is always an array to prevent map/filter errors
    const safeTrades = Array.isArray(trades) ? trades : [];
    
    // Helper function to ensure valid numbers - only fix truly invalid values
    const safeNumber = (value: number, defaultValue: number = 0): number => {
      if (typeof value !== 'number') return defaultValue;
      if (isNaN(value) || !isFinite(value)) return defaultValue;
      return value;
    };

    // Basic metrics - only validate final results
    const totalTrades = safeTrades.length;
    const profitableTrades = safeTrades.filter((trade) => trade.pnl > 0).length;
    const lossTrades = safeTrades.filter((trade) => trade.pnl < 0).length;
    const winRate = safeNumber(totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0);
    const totalProfitLoss = safeNumber(safeTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const currentBalance = safeNumber(initialBalance + totalProfitLoss);
    const percentageReturn = safeNumber(initialBalance > 0 ? (totalProfitLoss / initialBalance) * 100 : 0);
    
    // Advanced metrics - only validate final results
    const totalProfit = safeNumber(safeTrades
      .filter((trade) => trade.pnl > 0)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const totalLoss = safeNumber(safeTrades
      .filter((trade) => trade.pnl < 0)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const profitFactor = safeNumber(Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : totalProfit);
    
    const avgWin = safeNumber(profitableTrades > 0 ? totalProfit / profitableTrades : 0);
    
    const avgLoss = safeNumber(lossTrades > 0 ? Math.abs(totalLoss) / lossTrades : 0);
    
    const riskRewardRatio = safeNumber(avgLoss > 0 ? avgWin / avgLoss : avgWin);
    
    // Calculate drawdowns
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peak = initialBalance;
    
    const balanceOverTime = (() => {
      const sortedTrades = safeTrades
        .filter(trade => trade.entryTime) // Filter out trades without entry times
        .sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
      
      // Start with initial balance point
      const startPoint = {
        date: sortedTrades.length > 0 ? 
          new Date(sortedTrades[0].entryTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] : // Day before first trade
          new Date().toISOString().split('T')[0], // Or today if no trades
        balance: initialBalance,
        drawdown: 0
      };
      
      const tradePoints = sortedTrades.reduce((acc, trade, index) => {
        const date = trade.entryTime.toISOString().split('T')[0];
        const prevBalance = index > 0 ? acc[index - 1].balance : initialBalance;
        const currentBalance = prevBalance + (trade.pnl || 0);
        
        // Update peak and drawdown
        if (currentBalance > peak) {
          peak = currentBalance;
          currentDrawdown = 0;
        } else {
          currentDrawdown = peak > 0 ? (peak - currentBalance) / peak * 100 : 0;
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
      
      // Return initial balance point + trade points
      const result = sortedTrades.length > 0 ? [startPoint, ...tradePoints] : [startPoint];
      return result;
    })();
    
    // Generate trade count by date data
    const tradesByDate = safeTrades
      .filter(trade => trade.entryTime) // Filter out trades without entry times
      .reduce((acc, trade) => {
        const tradeDate = trade.entryTime;
        const date = tradeDate.toISOString().split('T')[0]; // Use ISO format for consistency
        const displayDate = tradeDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        if (!acc[date]) {
          acc[date] = {
            date: displayDate, // Keep display format for UI
            count: 0
          };
        }
        
        acc[date].count += 1;
        
        return acc;
      }, {} as Record<string, { date: string; count: number }>);
    
    const tradeCountByDate = Object.entries(tradesByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([_, data]) => data)
      .slice(-14); // Show just the last 14 days for a cleaner view
    
    // Analysis by asset (symbol)
    const assetPerformance = safeTrades.reduce((acc, trade) => {
      if (!acc[trade.symbol]) {
        acc[trade.symbol] = {
          asset: trade.symbol,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.symbol].trades += 1;
      
      if (trade.pnl > 0) {
        acc[trade.symbol].wins += 1;
      } else if (trade.pnl < 0) {
        acc[trade.symbol].losses += 1;
      }
      
      acc[trade.symbol].profitLoss += trade.pnl;
      
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
    const tradeTypePerformance = safeTrades.reduce((acc, trade) => {
      if (!acc[trade.type]) {
        acc[trade.type] = {
          type: trade.type,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.type].trades += 1;
      
      if (trade.pnl > 0) {
        acc[trade.type].wins += 1;
      } else if (trade.pnl < 0) {
        acc[trade.type].losses += 1;
      }
      
      acc[trade.type].profitLoss += trade.pnl;
      
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
    const emotionPerformance = safeTrades.reduce((acc, trade) => {
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
      
      if (trade.pnl > 0) {
        acc[trade.emotion].wins += 1;
      } else if (trade.pnl < 0) {
        acc[trade.emotion].losses += 1;
      }
      
      acc[trade.emotion].profitLoss += trade.pnl;
      
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
    const tradesByHour = safeTrades
      .filter(trade => trade.entryTime) // Filter out trades without entry times
      .reduce((acc, trade) => {
        const hour = trade.entryTime.getHours();
        
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
        
        if (trade.pnl > 0) {
          acc[hour].wins += 1;
        } else if (trade.pnl < 0) {
          acc[hour].losses += 1;
        }
        
        acc[hour].profitLoss += (trade.pnl || 0);
        
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
      winRate: safeNumber(item.trades > 0 ? (item.wins / item.trades) * 100 : 0),
      hourFormatted: `${item.hour}:00`
    }));

    const result = {
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
      winLossData: [
        { label: 'Wins', value: profitableTrades, color: '#10B981' },
        { label: 'Losses', value: lossTrades, color: '#EF4444' }
      ]
    };
    
    return result;
  }, [trades, initialBalance]);
}
