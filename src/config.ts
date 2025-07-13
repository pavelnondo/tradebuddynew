// Configuration for the application
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://mytradebuddy.ru/api',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // App Configuration
  appName: 'Trade Buddy',
  version: '1.0.0',
}; 