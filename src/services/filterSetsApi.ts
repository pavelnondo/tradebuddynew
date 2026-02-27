import { API_BASE_URL } from '@/config';

export interface FilterSetFilters {
  timeframe?: string;
  symbol?: string;
  tradeType?: string;
  emotion?: string;
  setupType?: string;
  marketCondition?: string;
  minPnL?: number;
  maxPnL?: number;
  minDuration?: number;
  maxDuration?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  notes?: string;
}

export interface FilterSet {
  id: number;
  name: string;
  description: string;
  filters: FilterSetFilters;
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const filterSetsApi = {
  async getAll(): Promise<FilterSet[]> {
    const response = await fetch(`${API_BASE_URL}/filter-sets`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch filter sets');
    }
    const data = await response.json();
    return (data.filterSets || []).map((fs: any) => ({
      id: fs.id,
      name: fs.name,
      description: fs.description || '',
      filters: fs.filters || {},
      isDefault: fs.isDefault ?? fs.is_default ?? false,
      created_at: fs.created_at,
      updated_at: fs.updated_at,
    }));
  },

  async create(filterSet: Omit<FilterSet, 'id' | 'created_at' | 'updated_at'>): Promise<FilterSet> {
    const response = await fetch(`${API_BASE_URL}/filter-sets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: filterSet.name,
        description: filterSet.description,
        filters: filterSet.filters,
        isDefault: filterSet.isDefault,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create filter set');
    }
    const row = await response.json();
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      filters: row.filters || {},
      isDefault: row.isDefault ?? row.is_default ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  async update(id: number, updates: Partial<FilterSet>): Promise<FilterSet> {
    const response = await fetch(`${API_BASE_URL}/filter-sets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        filters: updates.filters,
        isDefault: updates.isDefault,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update filter set');
    }
    const row = await response.json();
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      filters: row.filters || {},
      isDefault: row.isDefault ?? row.is_default ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/filter-sets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete filter set');
    }
  },
};
