import { useEffect, useState } from 'react';
import { Trade } from '@/types';

// Get the API base URL dynamically
const getApiBaseUrl = () => {
  // If we're in development, use the current hostname with port 4000
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    return `http://${hostname}:4000`;
  }
  // For production, you might want to use a different URL
  return import.meta.env.VITE_API_URL || 'http://localhost:4000';
};

export function useApiTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/trades`);
      if (!res.ok) throw new Error('Failed to fetch trades');
      const data = await res.json();
      // Map backend fields to frontend Trade type and parse dates
      const mappedTrades = data.map((trade: any) => ({
        id: trade.id,
        asset: trade.symbol,
        tradeType: trade.type,
        entryPrice: trade.entry_price !== undefined && trade.entry_price !== null ? Number(trade.entry_price) : 0,
        exitPrice: trade.exit_price !== undefined && trade.exit_price !== null ? Number(trade.exit_price) : 0,
        positionSize: trade.quantity !== undefined && trade.quantity !== null ? Number(trade.quantity) : 0,
        date: trade.entry_time ? new Date(trade.entry_time) : null,
        profitLoss: trade.pnl !== undefined && trade.pnl !== null ? Number(trade.pnl) : 0,
        notes: trade.notes || '',
        emotion: trade.emotion || '',
        screenshot: trade.screenshot || '',
        duration: trade.duration,
        setup: trade.setup,
        executionQuality: trade.execution_quality,
        checklist_id: trade.checklist_id,
        checklist_completed: trade.checklist_completed,
      }));
      setTrades(mappedTrades);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return { trades, isLoading, error, fetchTrades };
} 