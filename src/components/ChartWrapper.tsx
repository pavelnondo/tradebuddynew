
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
    if (value.theme && value.theme.light && value.theme.dark) {
      // When using theme, don't include color property at all
      uiConfig[key] = {
        label: value.label,
        theme: {
          light: value.theme.light,
          dark: value.theme.dark
        }
      };
    } else if (value.color) {
      // When using color, don't include theme property at all
      uiConfig[key] = {
        label: value.label,
        color: value.color
      };
    } else {
      // Just set the label if no theme or color
      uiConfig[key] = { 
        label: value.label 
      };
    }
  });

  return (
    <div className="h-full w-full">
      <UIChartContainer title={title} config={uiConfig}>
        {children}
      </UIChartContainer>
    </div>
  );
}
