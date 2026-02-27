import { API_BASE_URL } from '@/config';
import { Trade } from '@/types/trade';

export interface TradeQueryParams {
  page?: number;
  limit?: number;
  symbol?: string;
  tradeType?: string;
  emotion?: string;
  setupType?: string;
  session?: 'Asia' | 'London' | 'NewYork' | 'Other';
  startDate?: string;
  endDate?: string;
  accountId?: string;
  rMin?: number;
  rMax?: number;
  riskPercentMin?: number;
  riskPercentMax?: number;
  checklistPercentMin?: number;
  checklistPercentMax?: number;
  confidenceMin?: number;
  confidenceMax?: number;
  executionMin?: number;
  executionMax?: number;
  winLoss?: 'win' | 'loss' | 'breakeven' | 'all';
  durationMin?: number;
  durationMax?: number;
  tradeNumberMin?: number;
  tradeNumberMax?: number;
}

export interface TradeResponse {
  trades: Trade[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Get authentication headers for API requests
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Handle API error responses with proper error messages
 */
const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  let errorMessage = defaultMessage;
  
  try {
    const errorData: ApiError = await response.json();
    errorMessage = errorData.error || errorData.message || defaultMessage;
  } catch {
    // If JSON parsing fails, use status text or default message
    errorMessage = response.statusText || defaultMessage;
  }
  
  // Provide more specific error messages based on status code
  switch (response.status) {
    case 401:
      errorMessage = 'Authentication failed. Please log in again.';
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      break;
    case 403:
      errorMessage = 'You do not have permission to perform this action.';
      break;
    case 404:
      errorMessage = 'Trade not found.';
      break;
    case 422:
      errorMessage = errorMessage || 'Invalid data provided. Please check your input.';
      break;
    case 500:
      errorMessage = 'Server error. Please try again later.';
      break;
  }
  
  throw new Error(errorMessage);
};

/**
 * Trade API service with improved error handling and type safety
 */
export const tradeApi = {
  /**
   * Get all trades with optional filtering and pagination
   */
  async getTrades(params?: TradeQueryParams): Promise<TradeResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
      }
      
      const url = `${API_BASE_URL}/trades${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to fetch trades');
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching trades');
    }
  },

  /**
   * Get a single trade by ID
   */
  async getTrade(id: string | number): Promise<Trade> {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to fetch trade');
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching the trade');
    }
  },

  /**
   * Add a new trade
   */
  async addTrade(tradeData: Partial<Trade>): Promise<Trade> {
    try {
      const response = await fetch(`${API_BASE_URL}/trades`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(tradeData),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to add trade');
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while adding the trade');
    }
  },

  /**
   * Update an existing trade
   */
  async updateTrade(id: string | number, tradeData: Partial<Trade>): Promise<Trade> {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(tradeData),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to update trade');
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating the trade');
    }
  },

  /**
   * Delete a trade
   */
  async deleteTrade(id: string | number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to delete trade');
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while deleting the trade');
    }
  },
};
