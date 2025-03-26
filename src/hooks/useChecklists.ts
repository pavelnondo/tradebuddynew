
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Checklist, ChecklistItem } from '@/types';
import { toast } from '@/hooks/use-toast';

// Define a type for Supabase JSON
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export function useChecklists() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchChecklists = useCallback(async (): Promise<Checklist[]> => {
    if (!user) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(checklist => ({
        ...checklist,
        items: checklist.items as unknown as ChecklistItem[]
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch checklists');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getChecklist = useCallback(async (id: string): Promise<Checklist | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        items: data.items as unknown as ChecklistItem[]
      };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch checklist');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createChecklist = useCallback(async (checklist: Omit<Checklist, 'id' | 'created_at' | 'updated_at'>): Promise<Checklist | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('checklists')
        .insert({
          user_id: user.id,
          name: checklist.name,
          description: checklist.description || null,
          items: checklist.items as unknown as Json
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Checklist Created",
        description: "Your trading checklist has been created successfully.",
      });
      
      return {
        ...data,
        items: data.items as unknown as ChecklistItem[]
      };
    } catch (err: any) {
      setError(err.message || 'Failed to create checklist');
      toast({
        title: "Error Creating Checklist",
        description: err.message || 'Failed to create checklist',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateChecklist = useCallback(async (id: string, updates: Partial<Omit<Checklist, 'id' | 'created_at' | 'updated_at'>>): Promise<Checklist | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.items !== undefined) updateData.items = updates.items as unknown as Json;
      
      const { data, error } = await supabase
        .from('checklists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Checklist Updated",
        description: "Your trading checklist has been updated successfully.",
      });
      
      return {
        ...data,
        items: data.items as unknown as ChecklistItem[]
      };
    } catch (err: any) {
      setError(err.message || 'Failed to update checklist');
      toast({
        title: "Error Updating Checklist",
        description: err.message || 'Failed to update checklist',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteChecklist = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Checklist Deleted",
        description: "Your trading checklist has been deleted.",
      });
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete checklist');
      toast({
        title: "Error Deleting Checklist",
        description: err.message || 'Failed to delete checklist',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
