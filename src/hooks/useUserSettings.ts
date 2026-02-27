import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config';

export interface UserSettingsPreferences {
  numberPrecision?: number;
  pnlColorScheme?: 'green-red' | 'red-green';
  notifications?: {
    dailySummary?: boolean;
    weeklyReport?: boolean;
    goalReminders?: boolean;
    habitReminders?: boolean;
  };
}

export interface UserSettings {
  initial_balance: number;
  currency: string;
  date_format: string;
  preferences?: UserSettingsPreferences;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/user/settings`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/user/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update user settings');
      }

      const data = await response.json();
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  const updateInitialBalance = useCallback(async (initialBalance: number) => {
    return updateSettings({ initial_balance: initialBalance });
  }, [updateSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateInitialBalance,
  };
}



