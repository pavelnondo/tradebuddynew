import { useState, useCallback } from 'react';
import { Checklist, ChecklistItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

export function useChecklists() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchChecklists = useCallback(async (): Promise<Checklist[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/checklists`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch checklists');
      const data = await res.json();
      
      // Process checklists to ensure items are properly formatted
      const checklistsWithItems = data.map((checklist: any) => ({
        ...checklist,
        items: Array.isArray(checklist.items) ? checklist.items : []
      }));
      
      console.log('📋 Fetched checklists:', checklistsWithItems);
      return checklistsWithItems;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch checklists');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getChecklist = useCallback(async (id: string): Promise<Checklist | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch specific checklist by id (items are included in the main response now)
      const checklistRes = await fetch(`${API_BASE_URL}/api/checklists/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!checklistRes.ok) throw new Error('Failed to fetch checklist');
      const checklist = await checklistRes.json();
      
      // Process checklist to ensure items are properly formatted
      const processedChecklist = {
        ...checklist,
        items: Array.isArray(checklist.items) ? checklist.items : []
      };
      
      console.log('📋 Fetched single checklist:', processedChecklist);
      return processedChecklist;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch checklist');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new checklist
  const createChecklist = async (checklist: { name: string; description?: string; items: ChecklistItem[] }) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Frontend creating checklist:', checklist);
      
      // Create the checklist with items in a single call
      const res = await fetch(`${API_BASE_URL}/api/checklists`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: checklist.name,
          description: checklist.description,
          items: Array.isArray(checklist.items) ? checklist.items : []
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Create checklist failed:', errorText);
        throw new Error('Failed to create checklist');
      }
      
      const createdChecklist = await res.json();
      console.log('✅ Checklist created successfully:', createdChecklist);
      
      // Return the checklist with properly formatted items
      const fullChecklist = {
        id: createdChecklist.id,
        name: createdChecklist.name,
        description: createdChecklist.description,
        items: Array.isArray(createdChecklist.items) ? createdChecklist.items : []
      };
      
      toast({ title: 'Checklist Created', description: 'Your checklist was created successfully.' });
      return fullChecklist;
    } catch (err: any) {
      console.error('Frontend create error:', err);
      setError(err.message || 'Failed to create checklist');
      toast({ title: 'Error', description: err.message || 'Failed to create checklist', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing checklist
  const updateChecklist = async (id: string, updates: { name: string; description?: string; items: ChecklistItem[] }) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Frontend updating checklist:', { id, updates });
      
      // Update checklist with name, description, and items in a single call
      const res = await fetch(`${API_BASE_URL}/api/checklists/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          items: Array.isArray(updates.items) ? updates.items : []
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Update checklist failed:', errorText);
        throw new Error('Failed to update checklist');
      }
      
      const updatedChecklist = await res.json();
      console.log('✅ Checklist updated successfully:', updatedChecklist);
      
      // Return the checklist with properly formatted items
      const fullChecklist = {
        id: updatedChecklist.id,
        name: updatedChecklist.name,
        description: updatedChecklist.description,
        items: Array.isArray(updatedChecklist.items) ? updatedChecklist.items : []
      };
      
      toast({ title: 'Checklist Updated', description: 'Your checklist was updated successfully.' });
      return fullChecklist;
    } catch (err: any) {
      console.error('Frontend update error:', err);
      setError(err.message || 'Failed to update checklist');
      toast({ title: 'Error', description: err.message || 'Failed to update checklist', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a checklist
  const deleteChecklist = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/checklists/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete checklist');
      toast({ title: 'Checklist Deleted', description: 'Your checklist was deleted.' });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete checklist');
      toast({ title: 'Error', description: err.message || 'Failed to delete checklist', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    fetchChecklists,
    getChecklist,
    createChecklist,
    updateChecklist,
    deleteChecklist
  };
}
