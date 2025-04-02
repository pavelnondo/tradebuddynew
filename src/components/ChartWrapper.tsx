
import React, { ReactNode } from 'react';
import {
  ChartContainer as UIChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig as UIChartConfig
} from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';
import { ChartConfig } from '@/utils/chartUtils';

interface ChartWrapperProps {
  title: string;
  icon?: React.ReactNode;
  config: ChartConfig;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
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

  // Convert our ChartConfig to UI ChartConfig format
  const uiConfig: UIChartConfig = {};
  
  Object.entries(config).forEach(([key, value]) => {
    uiConfig[key] = {
      label: value.label,
      ...(value.color ? { color: value.color } : {}),
      ...(value.theme ? { theme: value.theme } : {})
    };
  });

  return (
    <div className="h-full w-full">
      <UIChartContainer title={title} config={uiConfig}>
        {children}
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </UIChartContainer>
    </div>
  );
}
