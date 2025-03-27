
import React, { ReactElement } from 'react';
import {
  ChartContainer as UIChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  icon?: React.ReactNode;
  config: Record<string, any>;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactElement;
}

export function ChartWrapper({
  title,
  icon,
  config,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  children
}: ChartWrapperProps) {
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-center text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <UIChartContainer title={title} config={config}>
      {children}
      <ChartTooltip content={<ChartTooltipContent />} />
      <ChartLegend content={<ChartLegendContent />} />
    </UIChartContainer>
  );
}
