import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  status: string;
  startDate?: string;
  endDate?: string;
  journalId?: string;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export function useGoals(journalId?: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = journalId 
        ? `${API_BASE_URL}/goals?journal_id=${journalId}`
        : `${API_BASE_URL}/goals`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [journalId]);

  const createGoal = useCallback(async (goalData: Partial<Goal>) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const newGoal = await response.json();
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
      throw err;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, goalData: Partial<Goal>) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      setGoals(prev => prev.map(goal => goal.id === id ? updatedGoal : goal));
      return updatedGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      throw err;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal
  };
}
