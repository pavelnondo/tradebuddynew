import { useEffect, useState } from 'react';
import { Trade } from '@/types';
import { API_BASE_URL } from '@/config';
// Fixed API response format handling v2

export function useApiTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBaseUrl = API_BASE_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch trades');
      const response = await res.json();
      // Extract trades array from the response object
      const data = response.trades || response;
      
      // Ensure data is an array before mapping
      if (!Array.isArray(data)) {
        console.warn('API returned non-array data:', data);
        setTrades([]);
        return;
      }
      // Map backend fields to frontend Trade type and parse dates
      const mappedTrades = data.map((trade: any) => ({
        id: trade.id,
        asset: trade.symbol,
        tradeType: trade.trade_type || trade.type, // Prefer trade_type (Long/Short) over type (buy/sell)
        type: trade.type, // Keep original type for backend compatibility
        entryPrice: trade.entry_price !== undefined && trade.entry_price !== null ? Number(trade.entry_price) : 0,
        exitPrice: trade.exit_price !== undefined && trade.exit_price !== null ? Number(trade.exit_price) : 0,
        positionSize: trade.quantity !== undefined && trade.quantity !== null ? Number(trade.quantity) : 0,
        date: trade.entry_time ? new Date(trade.entry_time) : null,
        profitLoss: trade.pnl !== undefined && trade.pnl !== null ? Number(trade.pnl) : 0,
        notes: trade.notes || '',
        emotion: trade.emotion || '',
        screenshot: trade.screenshot_url || trade.screenshot || '',
        duration: trade.duration,
        setup: trade.setup_type || trade.setup,
        executionQuality: trade.execution_quality,
        checklist_id: trade.checklist_id,
        checklist_completed: trade.checklist_completed,
        checklistItems: Array.isArray(trade.checklist_items) ? trade.checklist_items : undefined,
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