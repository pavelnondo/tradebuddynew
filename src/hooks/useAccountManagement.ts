import { useState, useEffect, useCallback } from 'react';
import { TradingAccount, AccountStats } from '@/types/account';
import { API_BASE_URL } from '@/config';

export function useAccountManagement() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all accounts
  const fetchAccounts = useCallback(async () => {
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
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      
      // Set active account (first active account or first account)
      const active = data.accounts?.find((acc: TradingAccount) => acc.isActive) || data.accounts?.[0];
      setActiveAccount(active || null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new account
  const createAccount = useCallback(async (name: string, initialBalance: number) => {
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
          initialBalance,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create account: ${response.statusText}`);
      }

      const newAccount = await response.json();
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Switch active account
  const switchAccount = useCallback(async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to switch account: ${response.statusText}`);
      }

      // Update local state
      setAccounts(prev => prev.map(acc => ({
        ...acc,
        isActive: acc.id === accountId
      })));
      
      const newActiveAccount = accounts.find(acc => acc.id === accountId);
      setActiveAccount(newActiveAccount || null);
      
      // Store active account in localStorage for persistence
      localStorage.setItem('activeAccountId', accountId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [accounts]);

  // Mark account as blown
  const markAccountAsBlown = useCallback(async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/blow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark account as blown: ${response.statusText}`);
      }

      // Update local state
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, isBlown: true, isActive: false, blownAt: new Date().toISOString() }
          : acc
      ));
      
      // If the blown account was active, switch to another account
      if (activeAccount?.id === accountId) {
        const nextActiveAccount = accounts.find(acc => acc.id !== accountId && !acc.isBlown && !acc.isPassed);
        if (nextActiveAccount) {
          await switchAccount(nextActiveAccount.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [activeAccount, accounts, switchAccount]);

  // Mark account as passed
  const markAccountAsPassed = useCallback(async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark account as passed: ${response.statusText}`);
      }

      // Update local state
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, isPassed: true, isActive: false, passedAt: new Date().toISOString() }
          : acc
      ));
      
      // If the passed account was active, switch to another account
      if (activeAccount?.id === accountId) {
        const nextActiveAccount = accounts.find(acc => acc.id !== accountId && !acc.isBlown && !acc.isPassed);
        if (nextActiveAccount) {
          await switchAccount(nextActiveAccount.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [activeAccount, accounts, switchAccount]);

  // Calculate account stats
  const accountStats: AccountStats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(acc => !acc.isBlown && !acc.isPassed).length,
    blownAccounts: accounts.filter(acc => acc.isBlown).length,
    passedAccounts: accounts.filter(acc => acc.isPassed).length,
    totalTradesAcrossAccounts: accounts.reduce((sum, acc) => sum + acc.totalTrades, 0),
    totalPnLAcrossAccounts: accounts.reduce((sum, acc) => sum + acc.totalPnL, 0),
    overallWinRate: accounts.length > 0 
      ? accounts.reduce((sum, acc) => sum + acc.winRate, 0) / accounts.length 
      : 0,
  };

  // Initialize on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Restore active account from localStorage
  useEffect(() => {
    const savedActiveAccountId = localStorage.getItem('activeAccountId');
    if (savedActiveAccountId && accounts.length > 0) {
      const savedAccount = accounts.find(acc => acc.id === savedActiveAccountId);
      if (savedAccount && !savedAccount.isBlown) {
        setActiveAccount(savedAccount);
      }
    }
  }, [accounts]);

  return {
    accounts,
    activeAccount,
    accountStats,
    isLoading,
    error,
    createAccount,
    switchAccount,
    markAccountAsBlown,
    markAccountAsPassed,
    fetchAccounts,
  };
}
