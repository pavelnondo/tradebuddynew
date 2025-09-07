import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiTrades } from './useApiTrades';

interface RevolutionaryDataState {
  balanceOverTime: Array<{ date: string; balance: number }>;
  winLossData: Array<{ label: string; value: number; color: string }>;
  hourlyPerformance: Array<{ hour: string; totalPnL: number; totalTrades: number; winRate: number }>;
  emotionPerformance: Array<{ emotion: string; winRate: number; totalTrades: number; totalPnL: number }>;
  setupPerformance: Array<{ setup: string; totalTrades: number; winRate: number; totalPnL: number; profitFactor: number }>;
  psychologyData: {
    emotionTrends: Array<any>;
    emotionPerformance: Array<any>;
    confidenceAnalysis: Array<any>;
    stressIndicators: {
      consecutiveLosses: number;
      recentDrawdown: number;
      emotionalVolatility: number;
      overtradingScore: number;
    };
  };
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataAccuracy: number;
}

export function useRevolutionaryData() {
  const { trades, isLoading: tradesLoading, error: tradesError } = useApiTrades();
  const [state, setState] = useState<RevolutionaryDataState>({
    balanceOverTime: [],
    winLossData: [],
    hourlyPerformance: [],
    emotionPerformance: [],
    setupPerformance: [],
    psychologyData: {
      emotionTrends: [],
      emotionPerformance: [],
      confidenceAnalysis: [],
      stressIndicators: {
        consecutiveLosses: 0,
        recentDrawdown: 0,
        emotionalVolatility: 0,
        overtradingScore: 0
      }
    },
    isLoading: true,
    error: null,
    lastUpdated: null,
    dataAccuracy: 0
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const accuracyRef = useRef<number>(0);

  // Revolutionary data validation with bulletproof accuracy
  const validateData = useCallback((data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Check for required fields
    const requiredFields = ['id', 'date', 'profit_loss', 'quantity', 'price'];
    const hasRequiredFields = requiredFields.every(field => 
      data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
    );
    
    // Check data types
    const hasValidTypes = 
      typeof data.id === 'number' &&
      typeof data.date === 'string' &&
      typeof data.profit_loss === 'number' &&
      typeof data.quantity === 'number' &&
      typeof data.price === 'number';
    
    // Check for valid values
    const hasValidValues = 
      !isNaN(data.profit_loss) &&
      !isNaN(data.quantity) &&
      !isNaN(data.price) &&
      data.quantity > 0 &&
      data.price > 0;
    
    return hasRequiredFields && hasValidTypes && hasValidValues;
  }, []);

  // Revolutionary data processing with real-time accuracy
  const processRevolutionaryData = useCallback(() => {
    if (!Array.isArray(trades) || trades.length === 0) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        dataAccuracy: 0,
        lastUpdated: new Date()
      }));
      return;
    }

    // Calculate data accuracy
    const validTrades = trades.filter(validateData);
    const accuracy = validTrades.length / trades.length;
    accuracyRef.current = accuracy;

    // Process balance over time with revolutionary accuracy
    const balanceOverTime = validTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, trade, index) => {
        const previousBalance = acc.length > 0 ? acc[acc.length - 1].balance : 10000; // Starting balance
        const newBalance = previousBalance + trade.profit_loss;
        
        acc.push({
          date: new Date(trade.date).toISOString(),
          balance: Math.round(newBalance * 100) / 100
        });
        
        return acc;
      }, [] as Array<{ date: string; balance: number }>);

    // Process win/loss data with revolutionary accuracy
    const wins = validTrades.filter(trade => trade.profit_loss > 0).length;
    const losses = validTrades.filter(trade => trade.profit_loss < 0).length;
    const winLossData = [
      { label: 'Wins', value: wins, color: '#10b981' },
      { label: 'Losses', value: losses, color: '#ef4444' }
    ];

    // Process hourly performance with revolutionary accuracy
    const hourlyMap = new Map<string, { totalPnL: number; totalTrades: number; wins: number }>();
    
    validTrades.forEach(trade => {
      const hour = new Date(trade.date).getHours().toString().padStart(2, '0');
      const existing = hourlyMap.get(hour) || { totalPnL: 0, totalTrades: 0, wins: 0 };
      
      existing.totalPnL += trade.profit_loss;
      existing.totalTrades += 1;
      if (trade.profit_loss > 0) existing.wins += 1;
      
      hourlyMap.set(hour, existing);
    });

    const hourlyPerformance = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({
        hour,
        totalPnL: Math.round(data.totalPnL * 100) / 100,
        totalTrades: data.totalTrades,
        winRate: data.totalTrades > 0 ? Math.round((data.wins / data.totalTrades) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Process emotion performance with revolutionary accuracy
    const emotionMap = new Map<string, { totalPnL: number; totalTrades: number; wins: number }>();
    
    validTrades.forEach(trade => {
      const emotion = trade.emotion || 'neutral';
      const existing = emotionMap.get(emotion) || { totalPnL: 0, totalTrades: 0, wins: 0 };
      
      existing.totalPnL += trade.profit_loss;
      existing.totalTrades += 1;
      if (trade.profit_loss > 0) existing.wins += 1;
      
      emotionMap.set(emotion, existing);
    });

    const emotionPerformance = Array.from(emotionMap.entries())
      .map(([emotion, data]) => ({
        emotion,
        totalPnL: Math.round(data.totalPnL * 100) / 100,
        totalTrades: data.totalTrades,
        winRate: data.totalTrades > 0 ? Math.round((data.wins / data.totalTrades) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL);

    // Process setup performance with revolutionary accuracy
    const setupMap = new Map<string, { totalPnL: number; totalTrades: number; wins: number; losses: number }>();
    
    validTrades.forEach(trade => {
      const setup = trade.setup || 'unknown';
      const existing = setupMap.get(setup) || { totalPnL: 0, totalTrades: 0, wins: 0, losses: 0 };
      
      existing.totalPnL += trade.profit_loss;
      existing.totalTrades += 1;
      if (trade.profit_loss > 0) {
        existing.wins += 1;
      } else {
        existing.losses += 1;
      }
      
      setupMap.set(setup, existing);
    });

    const setupPerformance = Array.from(setupMap.entries())
      .map(([setup, data]) => ({
        setup,
        totalPnL: Math.round(data.totalPnL * 100) / 100,
        totalTrades: data.totalTrades,
        winRate: data.totalTrades > 0 ? Math.round((data.wins / data.totalTrades) * 100 * 100) / 100 : 0,
        profitFactor: data.losses > 0 ? Math.round((data.wins / data.losses) * 100) / 100 : data.wins > 0 ? 999 : 0
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL);

    // Process psychology data with revolutionary accuracy
    const recentTrades = validTrades
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const consecutiveLosses = recentTrades
      .slice(0, 5)
      .reduce((count, trade) => trade.profit_loss < 0 ? count + 1 : 0, 0);

    const recentDrawdown = balanceOverTime.length > 1 ? 
      Math.round(((balanceOverTime[balanceOverTime.length - 1].balance - Math.max(...balanceOverTime.map(b => b.balance))) / Math.max(...balanceOverTime.map(b => b.balance)) * 100) * 100) / 100 : 0;

    const emotionalVolatility = emotionPerformance.length > 0 ? 
      Math.round((Math.max(...emotionPerformance.map(e => e.winRate)) - Math.min(...emotionPerformance.map(e => e.winRate))) * 100) / 100 : 0;

    const overtradingScore = validTrades.length > 20 ? Math.min(10, Math.round((validTrades.length / 20) * 10 * 100) / 100) : 0;

    const psychologyData = {
      emotionTrends: emotionPerformance.slice(0, 5),
      emotionPerformance: emotionPerformance,
      confidenceAnalysis: setupPerformance.slice(0, 3),
      stressIndicators: {
        consecutiveLosses,
        recentDrawdown,
        emotionalVolatility,
        overtradingScore
      }
    };

    setState(prev => ({
      ...prev,
      balanceOverTime,
      winLossData,
      hourlyPerformance,
      emotionPerformance,
      setupPerformance,
      psychologyData,
      isLoading: false,
      error: null,
      dataAccuracy: accuracy,
      lastUpdated: new Date()
    }));
  }, [trades, validateData]);

  // Revolutionary real-time data updates
  useEffect(() => {
    processRevolutionaryData();

    // Set up real-time updates every 30 seconds
    intervalRef.current = setInterval(() => {
      processRevolutionaryData();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [processRevolutionaryData]);

  // Revolutionary error handling
  useEffect(() => {
    if (tradesError) {
      setState(prev => ({
        ...prev,
        error: tradesError,
        isLoading: false
      }));
    }
  }, [tradesError]);

  // Revolutionary data refresh function
  const refreshData = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    processRevolutionaryData();
  }, [processRevolutionaryData]);

  return {
    ...state,
    refreshData,
    dataAccuracy: accuracyRef.current,
    isDataValid: accuracyRef.current > 0.8
  };
}
