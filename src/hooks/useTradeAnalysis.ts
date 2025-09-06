import { useMemo } from 'react';
import { Trade } from '@/types';

export function useTradeAnalysis(trades: Trade[], initialBalance: number) {
  return useMemo(() => {
    // Ensure trades is always an array to prevent map/filter errors
    const safeTrades = Array.isArray(trades) ? trades : [];
    console.log('useTradeAnalysis - trades:', safeTrades);
    console.log('useTradeAnalysis - initialBalance:', initialBalance);
    
    // Helper function to ensure valid numbers - only fix truly invalid values
    const safeNumber = (value: number, defaultValue: number = 0): number => {
      if (typeof value !== 'number') return defaultValue;
      if (isNaN(value) || !isFinite(value)) return defaultValue;
      return value;
    };

    // Basic metrics - only validate final results
    const totalTrades = safeTrades.length;
    const profitableTrades = safeTrades.filter((trade) => trade.profitLoss > 0).length;
    const lossTrades = safeTrades.filter((trade) => trade.profitLoss < 0).length;
    const winRate = safeNumber(totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0);
    const totalProfitLoss = safeNumber(safeTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    const currentBalance = safeNumber(initialBalance + totalProfitLoss);
    const percentageReturn = safeNumber(initialBalance > 0 ? (totalProfitLoss / initialBalance) * 100 : 0);
    
    // Advanced metrics - only validate final results
    const totalProfit = safeNumber(safeTrades
      .filter((trade) => trade.profitLoss > 0)
      .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    
    const totalLoss = safeNumber(safeTrades
      .filter((trade) => trade.profitLoss < 0)
      .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    
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
        .filter(trade => trade.date) // Filter out trades without dates
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Start with initial balance point
      const startPoint = {
        date: sortedTrades.length > 0 ? 
          new Date(new Date(sortedTrades[0].date).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] : // Day before first trade
          new Date().toISOString().split('T')[0], // Or today if no trades
        balance: initialBalance,
        drawdown: 0
      };
      
      const tradePoints = sortedTrades.reduce((acc, trade, index) => {
        const date = new Date(trade.date).toISOString().split('T')[0];
        const prevBalance = index > 0 ? acc[index - 1].balance : initialBalance;
        const currentBalance = prevBalance + (trade.profitLoss || 0);
        
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
      console.log('balanceOverTime result:', result);
      return result;
    })();
    
    // Generate trade count by date data
    const tradesByDate = safeTrades
      .filter(trade => trade.date) // Filter out trades without dates
      .reduce((acc, trade) => {
        const tradeDate = new Date(trade.date);
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
    
    // Analysis by asset
    const assetPerformance = safeTrades.reduce((acc, trade) => {
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
    const tradeTypePerformance = safeTrades.reduce((acc, trade) => {
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
    const tradesByHour = safeTrades
      .filter(trade => trade.date) // Filter out trades without dates
      .reduce((acc, trade) => {
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
        
        acc[hour].profitLoss += (trade.profitLoss || 0);
        
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
      winLossData: [
        { label: 'Wins', value: profitableTrades, color: '#10B981' },
        { label: 'Losses', value: lossTrades, color: '#EF4444' }
      ]
    };
  }, [trades, initialBalance]);
}
