import React from 'react';
import { ProperChart } from './ProperChart';

interface ProperWinLossChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  loading?: boolean;
  error?: string;
}

export function ProperWinLossChart({ data, loading, error }: ProperWinLossChartProps) {
  // Validate and process data
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(item => 
        item && 
        typeof item.label === 'string' && 
        typeof item.value === 'number' && 
        !isNaN(item.value) &&
        item.value >= 0
      )
      .map(item => ({
        label: item.label,
        value: Math.round(item.value),
        color: item.color || (item.label.toLowerCase().includes('win') ? '#10B981' : '#EF4444')
      }));
  }, [data]);

  const hasData = validData.length > 0;
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  const noDataMessage = 'Add trades to see your win/loss distribution';

  // Calculate donut chart dimensions with perfect proportions
  const size = 280;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segments
  let cumulativePercentage = 0;
  const segments = validData.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    
    cumulativePercentage += percentage;
    
    return {
      ...item,
      percentage: Math.round(percentage * 10) / 10,
      strokeDasharray,
      strokeDashoffset,
      index
    };
  });

  const winRate = segments.find(s => s.label.toLowerCase().includes('win'))?.percentage || 0;

  return (
    <ProperChart
      title="Win/Loss Distribution"
      description="Your trading performance breakdown"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Donut Chart */}
        <div className="relative mb-6">
          <svg width={size} height={size} className="overflow-visible">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            
            {/* Segments */}
            {segments.map((segment) => (
              <circle
                key={segment.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            ))}
          </svg>
          
          {/* Center text with perfect symmetry */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-foreground">{winRate.toFixed(0)}%</div>
            <div className="text-base text-muted-foreground font-medium">Win Rate</div>
          </div>
        </div>
        
        {/* Legend with perfect symmetry */}
        <div className="space-y-4 w-full max-w-sm">
          {segments.map((segment) => (
            <div key={segment.index} className="flex items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-base font-medium text-foreground">
                  {segment.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-foreground">
                  {segment.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {segment.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        {segments.length >= 2 && (
          <div className="mt-6 pt-4 border-t border-border w-full">
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="text-muted-foreground">Total Trades: </span>
                <span className="font-semibold text-foreground">
                  {total}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Win Rate: </span>
                <span className="font-semibold text-green-600">
                  {winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProperChart>
  );
}
