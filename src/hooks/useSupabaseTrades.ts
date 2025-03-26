
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Trade, ChecklistItem } from '@/types';
import { DbTrade, TradeInsert, TradeUpdate } from '@/types/supabase';

// Convert database trade to frontend trade
const dbTradeToTrade = (dbTrade: DbTrade): Trade => {
  return {
    id: dbTrade.id,
    date: dbTrade.date,
    asset: dbTrade.asset,
    tradeType: dbTrade.trade_type,
    entryPrice: Number(dbTrade.entry_price),
    exitPrice: Number(dbTrade.exit_price),
    positionSize: Number(dbTrade.position_size),
    profitLoss: Number(dbTrade.profit_loss),
    notes: dbTrade.notes || '',
    emotion: dbTrade.emotion || 'Calm',
    screenshot: dbTrade.screenshot,
    duration: dbTrade.duration,
    setup: dbTrade.setup,
    executionQuality: dbTrade.execution_quality,
    checklist_id: dbTrade.checklist_id,
    checklist_completed: dbTrade.checklist_completed as ChecklistItem[] || [],
  };
};

// Convert frontend trade to database trade
const tradeToDbTrade = (trade: Trade, userId: string): TradeInsert => {
  return {
    user_id: userId,
    date: trade.date,
    asset: trade.asset,
    trade_type: trade.tradeType,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    position_size: trade.positionSize,
    profit_loss: trade.profitLoss,
    notes: trade.notes,
    emotion: trade.emotion,
    screenshot: trade.screenshot,
    duration: trade.duration,
    setup: trade.setup,
    execution_quality: trade.executionQuality,
    checklist_id: trade.checklist_id,
    checklist_completed: trade.checklist_completed,
  };
};

export function useSupabaseTrades() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrades = useCallback(async (): Promise<Trade[]> => {
    if (!user) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(dbTradeToTrade);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trades');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addTrade = useCallback(async (trade: Trade): Promise<Trade | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const dbTrade = tradeToDbTrade(trade, user.id);
      
      const { data, error } = await supabase
        .from('trades')
        .insert(dbTrade)
        .select()
        .single();
      
      if (error) throw error;
      
      return dbTradeToTrade(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add trade');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>): Promise<Trade | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert frontend updates to database updates
      const dbUpdates: TradeUpdate = {};
      
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.asset !== undefined) dbUpdates.asset = updates.asset;
      if (updates.tradeType !== undefined) dbUpdates.trade_type = updates.tradeType;
      if (updates.entryPrice !== undefined) dbUpdates.entry_price = updates.entryPrice;
      if (updates.exitPrice !== undefined) dbUpdates.exit_price = updates.exitPrice;
      if (updates.positionSize !== undefined) dbUpdates.position_size = updates.positionSize;
      if (updates.profitLoss !== undefined) dbUpdates.profit_loss = updates.profitLoss;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.emotion !== undefined) dbUpdates.emotion = updates.emotion;
      if (updates.screenshot !== undefined) dbUpdates.screenshot = updates.screenshot;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.setup !== undefined) dbUpdates.setup = updates.setup;
      if (updates.executionQuality !== undefined) dbUpdates.execution_quality = updates.executionQuality;
      if (updates.checklist_id !== undefined) dbUpdates.checklist_id = updates.checklist_id;
      if (updates.checklist_completed !== undefined) dbUpdates.checklist_completed = updates.checklist_completed;
      
      const { data, error } = await supabase
        .from('trades')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return dbTradeToTrade(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update trade');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteTrade = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete trade');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const uploadScreenshot = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to upload screenshot');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    error,
    fetchTrades,
    addTrade,
    updateTrade,
    deleteTrade,
    uploadScreenshot,
  };
}
