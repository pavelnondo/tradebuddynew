
import { Database } from '@/integrations/supabase/types';

export type DbTrade = Database['public']['Tables']['trades']['Row'];

export type TradeInsert = Omit<DbTrade, 'id' | 'created_at' | 'updated_at'>;

export type TradeUpdate = Partial<Omit<DbTrade, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export interface Profile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  settings?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}
