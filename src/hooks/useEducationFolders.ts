import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

export type FolderSource = 'from-trade' | 'direct';

export interface EducationFolder {
  id: string;
  name: string;
  source?: FolderSource;
  sort_order: number;
  created_at: string;
}

export function useEducationFolders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchFolders = useCallback(async (source?: FolderSource): Promise<EducationFolder[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const url = source
        ? `${API_BASE_URL}/education-folders?source=${source}`
        : `${API_BASE_URL}/education-folders`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      return data as EducationFolder[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const createFolder = useCallback(
    async (name: string, source: FolderSource = 'direct'): Promise<EducationFolder | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/education-folders`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: name.trim(), source }),
        });
        if (!res.ok) throw new Error('Failed to create folder');
        const folder = await res.json();
        toast({ title: 'Folder created', description: `"${name}" was created.` });
        return folder as EducationFolder;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create folder';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const updateFolder = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/education-folders/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) throw new Error('Failed to update folder');
        toast({ title: 'Folder updated', description: 'Folder was renamed.' });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update folder';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/education-folders/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete folder');
        toast({ title: 'Folder deleted', description: 'Notes in this folder are now uncategorized.' });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete folder';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthHeaders]
  );

  return {
    isLoading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
