
import React, { ReactNode } from 'react';
import {
  ChartContainer as UIChartContainer,
  type ChartConfig as UIChartConfig
} from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';
import { ChartConfig } from '@/utils/chartUtils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      <Card>
        <CardContent className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="flex h-full w-full items-center justify-center">
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Convert our ChartConfig to UI ChartConfig format
  const uiConfig: UIChartConfig = {};
  Object.entries(config).forEach(([key, value]) => {
    if (value.theme && value.theme.light && value.theme.dark) {
      uiConfig[key] = {
        label: value.label,
        theme: {
          light: value.theme.light,
          dark: value.theme.dark
        }
      };
    } else if (value.color) {
      uiConfig[key] = {
        label: value.label,
        color: value.color
      };
    } else {
      uiConfig[key] = { 
        label: value.label 
      };
    }
  });

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-left !justify-start !items-start" style={{textAlign: 'left', justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <UIChartContainer title={title} config={uiConfig}>
          {React.isValidElement(children) ? (
            children
          ) : (
            <React.Fragment>{children}</React.Fragment>
          )}
        </UIChartContainer>
      </CardContent>
    </Card>
  );
}
