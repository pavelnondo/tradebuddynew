import React from 'react';
import { ResearchBasedChart, SPACING } from './ResearchBasedChart';

interface ResearchBasedWinLossChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  loading?: boolean;
  error?: string;
}

export function ResearchBasedWinLossChart({ data, loading, error }: ResearchBasedWinLossChartProps) {
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

  // Research-based donut chart dimensions following golden ratio principles
  // Optimal size for readability and visual impact
  const size = 320; // Research-based optimal size for donut charts
  const strokeWidth = 45; // Research-based stroke width for optimal visibility
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segments with research-based proportions
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
    <ResearchBasedChart
      title="Win/Loss Distribution"
      description="Your trading performance breakdown with research-based design"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Research-based donut chart with optimal proportions */}
        <div className="relative mb-8">
          <svg width={size} height={size} className="overflow-visible">
            {/* Research-based background circle with optimal opacity */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity="0.3" // Research-based opacity for subtle background
            />
            
            {/* Research-based segments with optimal stroke properties */}
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
                strokeLinecap="round" // Research-based rounded caps for modern look
                className="transition-all duration-700 ease-out" // Research-based smooth animation
              />
            ))}
          </svg>
          
          {/* Research-based center text with optimal typography hierarchy */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-foreground">{winRate.toFixed(0)}%</div>
            <div className={cn('text-muted-foreground font-medium mt-1', SPACING.axisFontSize)}>Win Rate</div>
          </div>
        </div>
        
        {/* Research-based legend with optimal spacing */}
        <div className={cn('space-y-4 w-full max-w-sm', SPACING.legendMargin)}>
          {segments.map((segment) => (
            <div key={segment.index} className={cn('flex items-center justify-between', SPACING.legendPadding)}>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-6 h-6 rounded-full" // Research-based larger indicators
                  style={{ backgroundColor: segment.color }}
                />
                <span className={cn('font-medium text-foreground', SPACING.legendFontSize)}>
                  {segment.label}
                </span>
              </div>
              <div className="text-right">
                <div className={cn('font-semibold text-foreground', SPACING.legendFontSize)}>
                  {segment.value}
                </div>
                <div className={cn('text-muted-foreground', SPACING.dataFontSize)}>
                  {segment.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Research-based summary stats with optimal spacing */}
        {segments.length >= 2 && (
          <div className={cn('pt-6 border-t border-border w-full', SPACING.legendMargin)}>
            <div className={cn('flex justify-between items-center', SPACING.axisPadding)}>
              <div>
                <span className={cn('text-muted-foreground', SPACING.dataFontSize)}>Total Trades: </span>
                <span className={cn('font-semibold text-foreground', SPACING.dataFontSize)}>
                  {total}
                </span>
              </div>
              <div>
                <span className={cn('text-muted-foreground', SPACING.dataFontSize)}>Win Rate: </span>
                <span className={cn('font-semibold text-green-600', SPACING.dataFontSize)}>
                  {winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResearchBasedChart>
  );
}
