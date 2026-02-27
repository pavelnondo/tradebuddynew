import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

export interface EducationNote {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  screenshot_url?: string | null;
  trade_id?: string | null;
  folder_id?: string | null;
  voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }>;
  created_at: string;
  updated_at: string;
}

interface CreateNoteInput {
  title: string;
  content: string;
  category?: string | null;
  tags?: string[];
  screenshot_url?: string | null;
  trade_id?: string | null;
  folder_id?: string | null;
  voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }>;
}

interface UpdateNoteInput extends CreateNoteInput {}

export function useEducationNotes() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchNotes = useCallback(async (params?: { category?: string; search?: string; trade_id?: string; source?: 'from-trade' | 'direct'; folder_id?: string }): Promise<EducationNote[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.trade_id) searchParams.set('trade_id', params.trade_id);
      if (params?.source) searchParams.set('source', params.source);
      if (params?.folder_id) searchParams.set('folder_id', params.folder_id);
      const url = `${API_BASE_URL}/education-notes${searchParams.toString() ? `?${searchParams}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      return (data as EducationNote[]).map((note: EducationNote) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
        voice_note_urls: Array.isArray(note.voice_note_urls) 
          ? note.voice_note_urls 
          : (typeof (note as any).voice_note_urls === 'string' 
              ? (() => {
                  try {
                    return JSON.parse((note as any).voice_note_urls);
                  } catch {
                    return [];
                  }
                })()
              : []),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notes';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const getNote = useCallback(async (id: string): Promise<EducationNote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/education-notes/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch note');
      const note = await res.json();
      return {
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
        voice_note_urls: Array.isArray(note.voice_note_urls)
          ? note.voice_note_urls
          : (typeof note.voice_note_urls === 'string'
              ? (() => {
                  try {
                    return JSON.parse(note.voice_note_urls);
                  } catch {
                    return [];
                  }
                })()
              : []),
      } as EducationNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch note';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const createNote = useCallback(async (input: CreateNoteInput): Promise<EducationNote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/education-notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          category: input.category || null,
          tags: input.tags || [],
          screenshot_url: input.screenshot_url || null,
          trade_id: input.trade_id || null,
          folder_id: input.folder_id || null,
          voice_note_urls: input.voice_note_urls || [],
        }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const note = await res.json();
      toast({ title: 'Note created', description: 'Your learning note was saved successfully.' });
      return {
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
        voice_note_urls: note.voice_note_urls || (typeof note.voice_note_urls === 'string' ? JSON.parse(note.voice_note_urls) : []),
      } as EducationNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const updateNote = useCallback(async (id: string, input: UpdateNoteInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/education-notes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          category: input.category || null,
          tags: input.tags || [],
          screenshot_url: input.screenshot_url ?? null,
          folder_id: input.folder_id ?? null,
          voice_note_urls: input.voice_note_urls !== undefined ? input.voice_note_urls : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      toast({ title: 'Note updated', description: 'Your learning note was updated successfully.' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/education-notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete note');
      toast({ title: 'Note deleted', description: 'Your learning note was removed.' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    isLoading,
    error,
    fetchNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
