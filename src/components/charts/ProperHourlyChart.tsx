import React from 'react';
import { ProperChart } from './ProperChart';

interface ProperHourlyChartProps {
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

export function ProperHourlyChart({ data, loading, error }: ProperHourlyChartProps) {
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

  // Calculate chart dimensions
  const maxProfitLoss = hasData ? Math.max(...validData.map(d => Math.abs(d.profitLoss))) : 1000;
  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar dimensions
  const barWidth = Math.min(30, plotWidth / Math.max(validData.length, 1) - 5);
  const barSpacing = (plotWidth - (validData.length * barWidth)) / (validData.length + 1);

  return (
    <ProperChart
      title="Hourly Performance"
      description="Profit/Loss and win rate by hour of day"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col">
        {/* Summary Stats */}
        {hasData && (
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Best Hour</div>
              <div className="text-lg font-semibold text-green-600">
                {validData.reduce((best, current) => 
                  current.profitLoss > best.profitLoss ? current : best
                ).hourFormatted}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Worst Hour</div>
              <div className="text-lg font-semibold text-red-600">
                {validData.reduce((worst, current) => 
                  current.profitLoss < worst.profitLoss ? current : worst
                ).hourFormatted}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-lg font-semibold text-blue-600">
                {validData.reduce((sum, item) => sum + item.tradeCount, 0)}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-0 overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
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
                  strokeWidth="1"
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
                    rx="4"
                    className="transition-all duration-300 hover:opacity-100"
                  />
                  
                  {/* Win rate indicator */}
                  <rect
                    x={x}
                    y={y + barHeight - 4}
                    width={barWidth}
                    height="4"
                    fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                    opacity="0.9"
                    rx="2"
                  />
                  
                  {/* Hour label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground font-medium"
                  >
                    {item.hourFormatted}
                  </text>
                  
                  {/* Value label */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-foreground font-semibold"
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
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
                >
                  ${value.toFixed(0)}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </ProperChart>
  );
}
