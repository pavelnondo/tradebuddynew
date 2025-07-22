import { useState, useCallback } from 'react';
import { Checklist, ChecklistItem } from '@/types';
import { toast } from '@/hooks/use-toast';

export function useChecklists() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async (): Promise<Checklist[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/checklists');
      if (!res.ok) throw new Error('Failed to fetch checklists');
      const data = await res.json();
      // Fetch items for each checklist in parallel
      const checklistsWithItems = await Promise.all(
        data.map(async (checklist: any) => {
          const itemsRes = await fetch(`http://localhost:4000/checklists/${checklist.id}/items`);
          let items = [];
          if (itemsRes.ok) {
            const rawItems = await itemsRes.json();
            // Map DB fields to frontend fields
            items = rawItems.map((item: any) => ({
              id: item.id,
              text: item.content,
              completed: item.checked,
            }));
          }
          return { ...checklist, items };
        })
      );
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
      // Fetch all checklists and find the one with the given id
      const checklistRes = await fetch('http://localhost:4000/checklists');
      if (!checklistRes.ok) throw new Error('Failed to fetch checklist');
      const checklists = await checklistRes.json();
      const checklist = checklists.find((c: any) => c.id == id);
      if (!checklist) throw new Error('Checklist not found');
      // Fetch the items for this checklist
      const itemsRes = await fetch(`http://localhost:4000/checklists/${id}/items`);
      if (!itemsRes.ok) throw new Error('Failed to fetch checklist items');
      const items = await itemsRes.json();
      // Map DB fields to frontend fields
      const mappedItems = items.map((item: any) => ({
        id: item.id,
        text: item.content,
        completed: item.checked,
      }));
      return { ...checklist, items: mappedItems };
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
      // Create the checklist
      const res = await fetch('http://localhost:4000/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: checklist.name, description: checklist.description }),
      });
      if (!res.ok) throw new Error('Failed to create checklist');
      const createdChecklist = await res.json();
      // Add items if any
      if (checklist.items && checklist.items.length > 0) {
        for (const item of checklist.items) {
          await fetch(`http://localhost:4000/checklists/${parseInt(createdChecklist.id, 10)}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: item.text, checked: item.completed || false }),
          });
        }
      }
      // Fetch items to return a complete checklist object
      const itemsRes = await fetch(`http://localhost:4000/checklists/${createdChecklist.id}/items`);
      let items = [];
      if (itemsRes.ok) {
        const rawItems = await itemsRes.json();
        items = rawItems.map((item: any) => ({
          id: item.id,
          text: item.content,
          completed: item.checked,
        }));
      }
      const fullChecklist = { ...createdChecklist, items };
      toast({ title: 'Checklist Created', description: 'Your checklist was created successfully.' });
      return fullChecklist;
    } catch (err: any) {
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
      // Update checklist name/description
      const res = await fetch(`http://localhost:4000/checklists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updates.name, description: updates.description }),
      });
      if (!res.ok) throw new Error('Failed to update checklist');
      // Update items: naive approach (delete all, re-add)
      await fetch(`http://localhost:4000/checklists/${id}/items`, { method: 'DELETE' });
      for (const item of updates.items) {
        await fetch(`http://localhost:4000/checklists/${parseInt(id, 10)}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: item.text, checked: item.completed || false }),
        });
      }
      // Fetch items to return a complete checklist object
      const checklistRes = await fetch(`http://localhost:4000/checklists/${id}`);
      let updatedChecklist = { id, name: updates.name, description: updates.description };
      if (checklistRes.ok) {
        updatedChecklist = await checklistRes.json();
      }
      const itemsRes = await fetch(`http://localhost:4000/checklists/${id}/items`);
      let items = [];
      if (itemsRes.ok) {
        const rawItems = await itemsRes.json();
        items = rawItems.map((item: any) => ({
          id: item.id,
          text: item.content,
          completed: item.checked,
        }));
      }
      const fullChecklist = { ...updatedChecklist, items };
      toast({ title: 'Checklist Updated', description: 'Your checklist was updated successfully.' });
      return fullChecklist;
    } catch (err: any) {
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
      const res = await fetch(`http://localhost:4000/checklists/${id}`, {
        method: 'DELETE',
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
