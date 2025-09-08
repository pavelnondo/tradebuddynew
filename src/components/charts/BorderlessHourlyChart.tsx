import React from 'react';
import { BorderlessChart } from './BorderlessChart';

interface BorderlessHourlyChartProps {
  data: Array<{ 
    hour: number; 
    profitLoss: number; 
    winRate: number; 
    tradeCount: number;
    hourFormatted?: string;
  }>;
  loading?: boolean;
  error?: string;
}

export function BorderlessHourlyChart({ data, loading, error }: BorderlessHourlyChartProps) {
  // Validate and process data
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(item => 
        item && 
        typeof item.hour === 'number' && 
        typeof item.profitLoss === 'number' && 
        typeof item.winRate === 'number' &&
        typeof item.tradeCount === 'number' &&
        !isNaN(item.hour) && 
        !isNaN(item.profitLoss) && 
        !isNaN(item.winRate) &&
        !isNaN(item.tradeCount) &&
        item.hour >= 0 && item.hour <= 23
      )
      .map(item => ({
        ...item,
        hourFormatted: item.hourFormatted || `${item.hour.toString().padStart(2, '0')}:00`,
        profitLoss: Math.round(item.profitLoss * 100) / 100,
        winRate: Math.round(item.winRate * 10) / 10,
        tradeCount: Math.round(item.tradeCount)
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [data]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades to see your hourly performance patterns';

  // Calculate chart dimensions - use full available space
  const maxProfitLoss = hasData ? Math.max(...validData.map(d => Math.abs(d.profitLoss))) : 1000;
  const chartWidth = 100; // Use percentage
  const chartHeight = 100; // Use percentage
  const margin = { top: 5, right: 5, bottom: 15, left: 15 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar dimensions
  const barWidth = Math.min(8, plotWidth / Math.max(validData.length, 1) - 1);
  const barSpacing = (plotWidth - (validData.length * barWidth)) / (validData.length + 1);

  return (
    <BorderlessChart
      title="Hourly Performance"
      description="Profit/Loss and win rate by hour of day"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full overflow-x-auto">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = margin.top + ratio * plotHeight;
            return (
              <line
                key={index}
                x1={margin.left}
                y1={y}
                x2={margin.left + plotWidth}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.2"
                opacity="0.3"
              />
            );
          })}

          {/* Bars */}
          {hasData && validData.map((item, index) => {
            const x = margin.left + barSpacing + index * (barWidth + barSpacing);
            const barHeight = maxProfitLoss > 0 ? (Math.abs(item.profitLoss) / maxProfitLoss) * plotHeight : 0;
            const y = item.profitLoss >= 0 ? 
              margin.top + plotHeight - barHeight : 
              margin.top + plotHeight;
            
            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.profitLoss >= 0 ? '#10B981' : '#EF4444'}
                  opacity="0.8"
                  rx="1"
                  className="transition-all duration-300 hover:opacity-100"
                />
                
                {/* Win rate indicator */}
                <rect
                  x={x}
                  y={y + barHeight - 0.5}
                  width={barWidth}
                  height="0.5"
                  fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                  opacity="0.9"
                  rx="0.2"
                />
                
                {/* Hour label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 2}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground font-medium"
                  fontSize="2"
                >
                  {item.hourFormatted}
                </text>
                
                {/* Value label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 1}
                  textAnchor="middle"
                  className="text-xs fill-foreground font-semibold"
                  fontSize="2"
                >
                  ${item.profitLoss.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const y = margin.top + ratio * plotHeight;
            return (
              <text
                key={index}
                x={margin.left - 2}
                y={y + 1}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
                fontSize="2"
              >
                ${value.toFixed(0)}
              </text>
            );
          })}
        </svg>
        
        {/* Summary Stats */}
        {hasData && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-muted-foreground">Best Hour: </span>
                  <span className="font-semibold text-green-600">
                    {validData.reduce((best, current) => 
                      current.profitLoss > best.profitLoss ? current : best
                    ).hourFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Worst Hour: </span>
                  <span className="font-semibold text-red-600">
                    {validData.reduce((worst, current) => 
                      current.profitLoss < worst.profitLoss ? current : worst
                    ).hourFormatted}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Trades: </span>
                <span className="font-semibold text-foreground">
                  {validData.reduce((sum, item) => sum + item.tradeCount, 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </BorderlessChart>
  );
}
