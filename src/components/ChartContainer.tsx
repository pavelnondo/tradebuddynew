
import React, { ReactNode } from 'react';
import { ChartConfig } from '@/utils/chartUtils';
import { ChartWrapper } from './ChartWrapper';

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  config?: ChartConfig;
  isEmpty?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartContainer({
  title,
  icon,
  config = {},
  isEmpty = false,
  isLoading = false,
  emptyMessage = "No data available",
  children
}: ChartContainerProps) {
  console.log('Rendering ChartContainer');
  return (
    <ChartWrapper
      title={title}
      icon={icon}
      config={config}
      isEmpty={isEmpty}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    >
      {children}
    </ChartWrapper>
  );
}
