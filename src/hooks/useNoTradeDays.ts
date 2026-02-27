import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config';

export interface NoTradeDay {
  id: string;
  userId: string;
  journalId: string | null;
  date: string;
  notes: string;
  screenshotUrl?: string | null;
  voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }>;
  createdAt: string;
  updatedAt: string;
}

interface FetchParams {
  journalId?: string;
  startDate?: string;
  endDate?: string;
}

function normalizeItem(x: NoTradeDay): NoTradeDay {
  return { 
    ...x, 
    date: (x.date || '').slice(0, 10),
    voice_note_urls: Array.isArray(x.voice_note_urls) 
      ? x.voice_note_urls 
      : (typeof (x as any).voice_note_urls === 'string' 
          ? (() => {
              try {
                return JSON.parse((x as any).voice_note_urls);
              } catch {
                return [];
              }
            })()
          : []),
  };
}

export function useNoTradeDays() {
  const [items, setItems] = useState<NoTradeDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchNoTradeDays = useCallback(async (params?: FetchParams): Promise<NoTradeDay[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (params?.journalId) sp.set('journal_id', params.journalId);
      if (params?.startDate) sp.set('start_date', params.startDate);
      if (params?.endDate) sp.set('end_date', params.endDate);
      const url = `${API_BASE_URL}/no-trade-days${sp.toString() ? '?' + sp.toString() : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch no trade days');
      const raw = await res.json();
      const data = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
      const list = (Array.isArray(data) ? data : []).map((x: NoTradeDay) => normalizeItem(x));
      setItems(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch';
      setError(msg);
      setItems([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addNoTradeDay = useCallback(async (date: string, notes: string, journalId?: string, screenshotUrl?: string | null, voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }>): Promise<NoTradeDay | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = String(date || '').trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Invalid date format');
      const res = await fetch(`${API_BASE_URL}/no-trade-days`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: dateStr, notes, journalId, screenshotUrl, voice_note_urls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && typeof data.error === 'string') ? data.error : `Failed to add (${res.status})`;
        throw new Error(msg);
      }
      if (!data || typeof data.id === 'undefined') {
        throw new Error('Invalid response from server');
      }
      const created = normalizeItem({
        ...data,
        date: (data.date || dateStr || '').toString().slice(0, 10),
        journalId: data.journalId ?? data.journal_id ?? journalId ?? null,
      } as NoTradeDay);
      setItems(prev => {
        const filtered = prev.filter(x => !((x.date || '').slice(0, 10) === created.date && String(x.journalId || '') === String(created.journalId || '')));
        return [created, ...filtered];
      });
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const updateNoTradeDay = useCallback(async (id: string, updates: { date?: string; notes?: string; screenshotUrl?: string | null; voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }> }): Promise<NoTradeDay | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/no-trade-days/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && typeof data.error === 'string') ? data.error : `Failed to update (${res.status})`;
        throw new Error(msg);
      }
      const updated = normalizeItem(data);
      setItems(prev => prev.map(x => x.id === id ? updated : x));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const deleteNoTradeDay = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/no-trade-days/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(x => x.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    noTradeDays: items,
    isLoading,
    error,
    fetchNoTradeDays,
    addNoTradeDay,
    updateNoTradeDay,
    deleteNoTradeDay,
  };
}
