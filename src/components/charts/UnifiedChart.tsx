import React from 'react';
import { cn } from '@/lib/utils';

interface UnifiedChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  error?: string;
  noData?: boolean;
  noDataMessage?: string;
}

const heightClasses = {
  sm: 'h-48',
  md: 'h-64', 
  lg: 'h-80',
  xl: 'h-96'
};

export function UnifiedChart({
  title,
  description,
  children,
  className,
  height = 'lg',
  loading = false,
  error,
  noData = false,
  noDataMessage = 'No data available'
}: UnifiedChartProps) {
  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}>
        <div className="p-6 pb-2">
          <div className="h-5 bg-muted animate-pulse rounded mb-2"></div>
          {description && <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>}
        </div>
        <div className="p-6 pt-0">
          <div className={cn(
            'bg-muted animate-pulse rounded',
            heightClasses[height]
          )}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}>
        <div className="p-6 pb-2">
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="p-6 pt-0">
          <div className={cn(
            'flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg',
            heightClasses[height]
          )}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (noData) {
    return (
      <div className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}>
        <div className="p-6 pb-2">
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="p-6 pt-0">
          <div className={cn(
            'flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg',
            heightClasses[height]
          )}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{noDataMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}>
      <div className="p-6 pb-2">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="p-6 pt-0">
        <div className={heightClasses[height]}>
          {children}
        </div>
      </div>
    </div>
  );
}
