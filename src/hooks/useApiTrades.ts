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
      // Map backend fields to frontend Trade type and parse dates with validation
      console.log('Raw API data:', data);
      console.log('API data length:', data.length);
      console.log('First trade sample:', data[0]);
      
      const mappedTrades = data.map((trade: any) => {
        // Helper function to safely convert to number
        const safeNumber = (value: any, defaultValue: number = 0): number => {
          if (value === undefined || value === null || value === '') return defaultValue;
          const num = Number(value);
          return isNaN(num) ? defaultValue : num;
        };

        // Helper function to safely parse date
        const safeDate = (dateValue: any): Date | null => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        return {
          id: trade.id,
          asset: trade.symbol || '',
          tradeType: trade.trade_type || trade.type || '', // Prefer trade_type (Long/Short) over type (buy/sell)
          type: trade.type || '', // Keep original type for backend compatibility
          entryPrice: safeNumber(trade.entry_price, 0),
          exitPrice: safeNumber(trade.exit_price, 0),
          positionSize: safeNumber(trade.quantity, 0),
          date: safeDate(trade.entry_time),
          profitLoss: safeNumber(trade.pnl, 0),
          notes: trade.notes || '',
          emotion: trade.emotion || '',
          screenshot: trade.screenshot_url || trade.screenshot || '',
          duration: safeNumber(trade.duration, 0),
          setup: trade.setup_type || trade.setup || '',
          executionQuality: trade.execution_quality || '',
          checklist_id: trade.checklist_id,
          checklist_completed: trade.checklist_completed,
          checklistItems: Array.isArray(trade.checklist_items) ? trade.checklist_items : undefined,
        };
      });
      console.log('Mapped trades:', mappedTrades);
      console.log('Mapped trades length:', mappedTrades.length);
      console.log('First mapped trade:', mappedTrades[0]);
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