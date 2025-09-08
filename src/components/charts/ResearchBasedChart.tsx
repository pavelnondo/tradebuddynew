import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResearchBasedChartProps {
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

// Research-based height classes following golden ratio principles
const heightClasses = {
  sm: 'h-72',    // 288px - maintains good proportions
  md: 'h-96',    // 384px - optimal for most charts
  lg: 'h-[28rem]', // 448px - golden ratio compliant
  xl: 'h-[32rem]'  // 512px - for complex charts
};

// Research-based spacing constants
const SPACING = {
  // Chart Title: 1.8-2.2x base font size, 10-15px internal padding, 15-20px external margin
  titleFontSize: 'text-2xl', // 1.8x base (24px)
  titlePadding: 'pb-4', // 16px internal padding
  titleMargin: 'mb-6', // 24px external margin
  
  // Axis Labels: 1.2-1.4x base font size, 5-10px internal padding, 10-15px external margin
  axisFontSize: 'text-sm', // 1.2x base (14px)
  axisPadding: 'px-2', // 8px internal padding
  axisMargin: 'mx-4', // 16px external margin
  
  // Data Labels: 1.0-1.2x base font size, 3-5px internal padding, 5-8px external margin
  dataFontSize: 'text-xs', // 1.0x base (12px)
  dataPadding: 'px-1', // 4px internal padding
  dataMargin: 'mx-2', // 8px external margin
  
  // Legend: 1.0-1.2x base font size, 8-12px internal padding, 10-15px external margin
  legendFontSize: 'text-sm', // 1.2x base (14px)
  legendPadding: 'p-3', // 12px internal padding
  legendMargin: 'mt-4', // 16px external margin
};

export function ResearchBasedChart({
  title,
  description,
  children,
  className,
  height = 'lg',
  loading = false,
  error,
  noData = false,
  noDataMessage = 'No data available'
}: ResearchBasedChartProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className={cn(SPACING.titlePadding, SPACING.titleMargin)}>
        <CardTitle className={cn(SPACING.titleFontSize, 'font-semibold leading-tight tracking-tight')}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className={cn('text-sm text-muted-foreground mt-2', SPACING.axisPadding)}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn('pt-0', heightClasses[height])}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className={cn('text-muted-foreground', SPACING.dataFontSize)}>Loading data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className={cn('font-medium text-destructive', SPACING.dataFontSize)}>{error}</p>
            </div>
          </div>
        ) : noData ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className={cn('font-medium text-muted-foreground', SPACING.dataFontSize)}>{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export spacing constants for use in chart components
export { SPACING };
