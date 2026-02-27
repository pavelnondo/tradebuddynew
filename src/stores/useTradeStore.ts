/**
 * Zustand store for trade management
 * Global state for all trades, filters, and trade-related UI state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, TradeType, Emotion } from '@/types/trade';

interface TradeFilters {
  search: string;
  type: TradeType | 'all';
  emotion: Emotion | 'all';
  timeRange: '7D' | '30D' | '90D' | 'ALL';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  symbol: string;
  minPnL: number | null;
  maxPnL: number | null;
}

interface TradeStore {
  // State
  trades: Trade[];
  filters: TradeFilters;
  selectedTrades: string[];
      sortBy: 'date' | 'symbol' | 'pnl' | 'pnlPercent';
      sort: {
        key: 'entryTime' | 'symbol' | 'pnl' | 'pnlPercent';
        direction: 'asc' | 'desc';
      };
      setSort: (key: 'entryTime' | 'symbol' | 'pnl' | 'pnlPercent', direction: 'asc' | 'desc') => void;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;

  // Actions
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  deleteTrades: (ids: string[]) => void;
  
  // Filters
  setFilter: <K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) => void;
  resetFilters: () => void;
  
  // Selection
  toggleTradeSelection: (id: string) => void;
  selectAllTrades: () => void;
  clearSelection: () => void;
  
  // Sorting
  setSorting: (by: 'date' | 'symbol' | 'pnl' | 'pnlPercent', order?: 'asc' | 'desc') => void;
  setSort: (key: 'entryTime' | 'symbol' | 'pnl' | 'pnlPercent', direction: 'asc' | 'desc') => void;
  
  // Computed
  getFilteredTrades: () => Trade[];
  getSortedTrades: () => Trade[];
  
  // Analytics
  getWinRate: () => number;
  getTotalPnL: () => number;
  getAveragePnL: () => number;
  getTradesByEmotion: () => Record<Emotion, number>;
  getTradesByType: () => Record<TradeType, number>;
}

const defaultFilters: TradeFilters = {
  search: '',
  type: 'all',
  emotion: 'all',
  timeRange: 'ALL',
  dateRange: {
    start: null,
    end: null,
  },
  symbol: '',
  minPnL: null,
  maxPnL: null,
};

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      trades: [],
      filters: defaultFilters,
      selectedTrades: [],
      sortBy: 'date',
      sortOrder: 'desc',
      sort: {
        key: 'entryTime',
        direction: 'desc',
      },
      isLoading: false,
      error: null,

      // Set trades
      setTrades: (trades) => set({ trades }),

      // Add trade
      addTrade: (trade) => set((state) => ({ trades: [...state.trades, trade] })),

      // Update trade
      updateTrade: (id, updates) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === id ? { ...trade, ...updates } : trade
          ),
        })),

      // Delete trade
      deleteTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
          selectedTrades: state.selectedTrades.filter((selectedId) => selectedId !== id),
        })),

      // Delete multiple trades
      deleteTrades: (ids) =>
        set((state) => ({
          trades: state.trades.filter((trade) => !ids.includes(trade.id)),
          selectedTrades: [],
        })),

      // Set filter
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      // Reset filters
      resetFilters: () => set({ filters: defaultFilters }),

      // Toggle trade selection
      toggleTradeSelection: (id) =>
        set((state) => ({
          selectedTrades: state.selectedTrades.includes(id)
            ? state.selectedTrades.filter((selectedId) => selectedId !== id)
            : [...state.selectedTrades, id],
        })),

      // Select all trades
      selectAllTrades: () =>
        set((state) => ({
          selectedTrades: state.getFilteredTrades().map((trade) => trade.id),
        })),

      // Clear selection
      clearSelection: () => set({ selectedTrades: [] }),

      // Set sorting
      setSorting: (by, order) =>
        set((state) => ({
          sortBy: by,
          sortOrder: order || (state.sortBy === by && state.sortOrder === 'asc' ? 'desc' : 'asc'),
          sort: {
            key: by === 'date' ? 'entryTime' : by,
            direction: order || (state.sortBy === by && state.sortOrder === 'asc' ? 'desc' : 'asc'),
          },
        })),

      // Set sort (newer API used by TradeManagement)
      setSort: (key, direction) =>
        set((state) => ({
          sortBy: key === 'entryTime' ? 'date' : key,
          sortOrder: direction,
          sort: {
            key,
            direction,
          },
        })),

      // Get filtered trades
      getFilteredTrades: () => {
        const { trades, filters } = get();
        return trades.filter((trade) => {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
              trade.symbol.toLowerCase().includes(searchLower) ||
              trade.notes.toLowerCase().includes(searchLower) ||
              trade.tags.some((tag) => tag.toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;
          }

          // Type filter
          if (filters.type !== 'all' && trade.type !== filters.type) return false;

          // Emotion filter
          if (filters.emotion !== 'all' && trade.emotion !== filters.emotion) return false;

          // Symbol filter
          if (filters.symbol && trade.symbol !== filters.symbol) return false;

          // Date range filter
          if (filters.dateRange.start && trade.entryTime < filters.dateRange.start) return false;
          if (filters.dateRange.end && trade.entryTime > filters.dateRange.end) return false;

          // P&L range filter
          if (filters.minPnL !== null && trade.pnl < filters.minPnL) return false;
          if (filters.maxPnL !== null && trade.pnl > filters.maxPnL) return false;

          return true;
        });
      },

      // Get sorted trades
      getSortedTrades: () => {
        const { getFilteredTrades, sortBy, sortOrder } = get();
        const trades = getFilteredTrades();

        return [...trades].sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'date':
              comparison = a.entryTime.getTime() - b.entryTime.getTime();
              break;
            case 'symbol':
              comparison = a.symbol.localeCompare(b.symbol);
              break;
            case 'pnl':
              comparison = a.pnl - b.pnl;
              break;
            case 'pnlPercent':
              comparison = a.pnlPercent - b.pnlPercent;
              break;
          }

          return sortOrder === 'asc' ? comparison : -comparison;
        });
      },

      // Get win rate
      getWinRate: () => {
        const { trades } = get();
        if (trades.length === 0) return 0;
        const winningTrades = trades.filter((trade) => trade.pnl > 0);
        return Math.round((winningTrades.length / trades.length) * 10000) / 100; // 2 decimals
      },

      // Get total P&L
      getTotalPnL: () => {
        const { trades } = get();
        return Math.round(trades.reduce((sum, trade) => sum + trade.pnl, 0) * 100) / 100;
      },

      // Get average P&L
      getAveragePnL: () => {
        const { trades, getTotalPnL } = get();
        if (trades.length === 0) return 0;
        return Math.round((getTotalPnL() / trades.length) * 100) / 100;
      },

      // Get trades by emotion
      getTradesByEmotion: () => {
        const { trades } = get();
        const emotionCounts: Record<string, number> = {};
        trades.forEach((trade) => {
          emotionCounts[trade.emotion] = (emotionCounts[trade.emotion] || 0) + 1;
        });
        return emotionCounts as Record<Emotion, number>;
      },

      // Get trades by type
      getTradesByType: () => {
        const { trades } = get();
        const typeCounts: Record<string, number> = {};
        trades.forEach((trade) => {
          typeCounts[trade.type] = (typeCounts[trade.type] || 0) + 1;
        });
        return typeCounts as Record<TradeType, number>;
      },
    }),
    {
      name: 'trade-storage',
      partialize: (state) => ({
        trades: state.trades,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

