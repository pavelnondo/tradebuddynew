/**
 * Error Boundary Provider
 * Wraps the app with error boundaries
 */

import React from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
}

export const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

