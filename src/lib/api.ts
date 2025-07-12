import { config } from '@/config';

// API configuration
export const API_BASE_URL = config.apiUrl;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}; 