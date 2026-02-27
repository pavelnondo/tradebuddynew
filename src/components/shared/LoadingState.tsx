/**
 * Loading State Component
 * Displays skeleton loaders and loading indicators
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'grid' | 'list';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  count = 3,
  className,
}) => {
  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
        </div>
      </Card>
    );
  }

  if (type === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-10 bg-muted rounded w-full animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return null;
};

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('h-4 bg-muted rounded animate-pulse', className)}
        />
      ))}
    </>
  );
};

