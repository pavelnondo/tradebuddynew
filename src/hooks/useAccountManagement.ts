import { useState, useEffect, useCallback } from 'react';
import { TradingJournal, JournalStats } from '@/types/account';
import { API_BASE_URL } from '@/config';

export function useJournalManagement() {
  const [journals, setJournals] = useState<TradingJournal[]>([]);
  const [activeJournal, setActiveJournal] = useState<TradingJournal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all journals
  const fetchJournals = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch journals: ${response.statusText}`);
      }

      const data = await response.json();
      setJournals(data.accounts || []);
      
      // Set active journal (first active journal or first journal)
      const active = data.accounts?.find((journal: TradingJournal) => journal.isActive) || data.accounts?.[0];
      setActiveJournal(active || null);
    } catch (err: any) {
      setError(err.message);
      // Error handled by setError
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new journal - accepts (name, initialBalance) or full object
  const createJournal = useCallback(async (
    nameOrArgs: string | { name: string; accountType?: string; initialBalance: number; currency?: string },
    initialBalanceArg?: number
  ) => {
    const args = typeof nameOrArgs === 'object'
      ? nameOrArgs
      : { name: nameOrArgs, initialBalance: initialBalanceArg ?? 0 };
    const { name, accountType = 'paper', initialBalance, currency = 'USD' } = args;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          accountType,
          initialBalance,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create journal: ${response.statusText}`);
      }

      const newJournal = await response.json();
      setJournals(prev => [...prev, newJournal]);
      return newJournal;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update journal
  const updateJournal = useCallback(async (journalId: string, updates: { name?: string; initialBalance?: number }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${journalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update journal: ${response.statusText}`);
      }

      const data = await response.json();
      const updated = data.account ?? data;
      setJournals(prev => prev.map(j => j.id === journalId ? { ...j, ...updated, initialBalance: updated.initialBalance ?? j.initialBalance } : j));
      if (activeJournal?.id === journalId) {
        setActiveJournal(prev => prev ? { ...prev, ...updated, initialBalance: updated.initialBalance ?? prev.initialBalance } : null);
      }
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [activeJournal]);

  // Delete journal
  const deleteJournal = useCallback(async (journalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${journalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete journal: ${response.statusText}`);
      }

      // Remove journal from state
      setJournals(prev => prev.filter(journal => journal.id !== journalId));
      
      // If the deleted journal was active, switch to another journal
      if (activeJournal?.id === journalId) {
        const remainingJournals = journals.filter(journal => journal.id !== journalId);
        if (remainingJournals.length > 0) {
          await switchJournal(remainingJournals[0].id);
        } else {
          setActiveJournal(null);
        }
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [journals, activeJournal]);

  // Switch active journal
  const switchJournal = useCallback(async (journalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${journalId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to switch journal: ${response.statusText}`);
      }

      // Update journals state - mark the selected one as active
      let newActiveJournal: TradingJournal | null = null;
      
      setJournals(prev => {
        const updated = prev.map(journal => ({
          ...journal,
          isActive: journal.id === journalId
        }));
        
        // Find the new active journal to update state separately
        newActiveJournal = updated.find(journal => journal.id === journalId) || null;
        
        return updated;
      });
      
      // Update activeJournal AFTER journals state is updated
      // Create a NEW object to ensure React detects the change
      if (newActiveJournal) {
        // Spread to create a completely new object reference
        setActiveJournal({ ...newActiveJournal });
      }
      
      // Store active journal in localStorage for persistence
      localStorage.setItem('activeJournalId', journalId);
    } catch (err: any) {
      setError(err.message);
      // Error handled by setError
      throw err;
    }
  }, []);

  // Mark journal as blown
  const markJournalAsBlown = useCallback(async (journalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${journalId}/blow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark journal as blown: ${response.statusText}`);
      }

      // Update local state
      setJournals(prev => prev.map(journal => 
        journal.id === journalId 
          ? { ...journal, isBlown: true, isActive: false, blownAt: new Date().toISOString() }
          : journal
      ));
      
      // If the blown journal was active, switch to another journal
      if (activeJournal?.id === journalId) {
        const nextActiveJournal = journals.find(journal => journal.id !== journalId && !journal.isBlown && !journal.isPassed);
        if (nextActiveJournal) {
          await switchJournal(nextActiveJournal.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [activeJournal, journals, switchJournal]);

  // Mark journal as passed
  const markJournalAsPassed = useCallback(async (journalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${journalId}/pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark journal as passed: ${response.statusText}`);
      }

      // Update local state
      setJournals(prev => prev.map(journal => 
        journal.id === journalId 
          ? { ...journal, isPassed: true, isActive: false, passedAt: new Date().toISOString() }
          : journal
      ));
      
      // If the passed journal was active, switch to another journal
      if (activeJournal?.id === journalId) {
        const nextActiveJournal = journals.find(journal => journal.id !== journalId && !journal.isBlown && !journal.isPassed);
        if (nextActiveJournal) {
          await switchJournal(nextActiveJournal.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [activeJournal, journals, switchJournal]);

  // Calculate journal stats
  const journalStats: JournalStats = {
    totalJournals: journals.length,
    activeJournals: journals.filter(journal => journal.isActive).length,
    blownJournals: journals.filter(journal => journal.isBlown).length,
    passedJournals: journals.filter(journal => journal.isPassed).length,
    totalTradesAcrossJournals: journals.reduce((sum, journal) => sum + journal.totalTrades, 0),
    totalPnLAcrossJournals: journals.reduce((sum, journal) => sum + journal.totalPnL, 0),
    overallWinRate: journals.length > 0 
      ? journals.reduce((sum, journal) => sum + journal.winRate, 0) / journals.length 
      : 0
  };

  // Load journals on mount
  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  // Sync activeJournal whenever journals change
  useEffect(() => {
    const active = journals.find(j => j.isActive);
    if (active && (!activeJournal || activeJournal.id !== active.id)) {
      // Spread to create a new object reference for React to detect
      setActiveJournal({ ...active });
    }
  }, [journals, activeJournal]);

  // Load active journal from localStorage on mount
  useEffect(() => {
    const savedJournalId = localStorage.getItem('activeJournalId');
    if (savedJournalId && journals.length > 0) {
      const savedJournal = journals.find(journal => journal.id === savedJournalId);
      if (savedJournal && savedJournal.isActive) {
        setActiveJournal(savedJournal);
      }
    }
  }, [journals]);

  return {
    journals,
    activeJournal,
    journalStats,
    isLoading,
    error,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
    switchJournal,
    markJournalAsBlown,
    markJournalAsPassed
  };
}

// Keep the old export for backward compatibility
export const useAccountManagement = useJournalManagement;