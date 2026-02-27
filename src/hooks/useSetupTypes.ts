import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

export interface SetupType {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useSetupTypes() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchSetupTypes = useCallback(async (): Promise<SetupType[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/setup-types`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch setup types');
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch setup types');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSetupType = useCallback(async (data: { name: string; description?: string }): Promise<SetupType | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/setup-types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create setup type');
      const created = await res.json();
      toast({ title: 'Setup type created', description: 'Your setup type was added.' });
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create setup type');
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create setup type', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetupType = useCallback(async (id: string, data: { name: string; description?: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/setup-types/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update setup type');
      toast({ title: 'Setup type updated', description: 'Your setup type was updated.' });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setup type');
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update setup type', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSetupType = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/setup-types/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete setup type');
      toast({ title: 'Setup type deleted', description: 'Your setup type was removed.' });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete setup type');
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete setup type', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchSetupTypes,
    createSetupType,
    updateSetupType,
    deleteSetupType,
  };
}
