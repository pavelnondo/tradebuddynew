import { API_BASE_URL } from '@/config';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const tradeApi = {
  // Get all trades
  async getTrades(params?: {
    page?: number;
    limit?: number;
    symbol?: string;
    tradeType?: string;
    emotion?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_BASE_URL}/trades${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch trades');
    }
    
    return response.json();
  },

  // Add a new trade
  async addTrade(tradeData: any) {
    const response = await fetch(`${API_BASE_URL}/trades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tradeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add trade');
    }
    
    return response.json();
  },

  // Update a trade
  async updateTrade(id: string | number, tradeData: any) {
    const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(tradeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update trade');
    }
    
    return response.json();
  },

  // Delete a trade
  async deleteTrade(id: string | number) {
    const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete trade');
    }
    
    return response.json();
  },

  // Get a single trade by ID
  async getTrade(id: string | number) {
    const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trade');
    }
    
    return response.json();
  }
};
