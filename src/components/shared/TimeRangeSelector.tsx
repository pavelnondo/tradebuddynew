/**
 * TimeRangeSelector component
 * Unified time filter selector for charts and data
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimeRange = '7D' | '30D' | '90D' | 'ALL';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const ranges: TimeRange[] = ['7D', '30D', '90D', 'ALL'];

  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label="Time range selector">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(range)}
          aria-pressed={value === range}
          className={cn(
            'transition-all',
            value === range && 'ring-2 ring-primary'
          )}
        >
          {range}
        </Button>
      ))}
    </div>
  );
};

