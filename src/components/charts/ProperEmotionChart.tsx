import React from 'react';
import { ProperChart } from './ProperChart';

interface ProperEmotionChartProps {
  data: Array<{ 
    emotion: string; 
    avgProfitLoss: number; 
    winRate: number; 
    tradeCount: number;
  }>;
  loading?: boolean;
  error?: string;
}

const emotionIcons: { [key: string]: string } = {
  'confident': '😎',
  'calm': '😌',
  'excited': '🤩',
  'nervous': '😰',
  'fearful': '😨',
  'greedy': '🤤',
  'frustrated': '😤',
  'neutral': '😐',
  'anxious': '😟',
  'optimistic': '😊',
  'pessimistic': '😔'
};

export function ProperEmotionChart({ data, loading, error }: ProperEmotionChartProps) {
  // Validate and process data
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(item => 
        item && 
        typeof item.emotion === 'string' && 
        typeof item.avgProfitLoss === 'number' && 
        typeof item.winRate === 'number' &&
        typeof item.tradeCount === 'number' &&
        !isNaN(item.avgProfitLoss) && 
        !isNaN(item.winRate) && 
        !isNaN(item.tradeCount) &&
        item.tradeCount > 0
      )
      .map(item => ({
        ...item,
        avgProfitLoss: Math.round(item.avgProfitLoss * 100) / 100,
        winRate: Math.round(item.winRate * 10) / 10,
        tradeCount: Math.round(item.tradeCount)
      }))
      .sort((a, b) => b.avgProfitLoss - a.avgProfitLoss);
  }, [data]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades with emotions to see emotional patterns';

  // Calculate chart dimensions with perfect proportions
  const maxProfitLoss = hasData ? Math.max(...validData.map(d => Math.abs(d.avgProfitLoss))) : 1000;
  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 30, right: 40, bottom: 50, left: 100 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar dimensions with perfect proportions
  const barHeight = 28;
  const barSpacing = 12;
  const totalBarHeight = barHeight + barSpacing;

  return (
    <ProperChart
      title="Emotion Impact"
      description="How emotions correlate with trading performance"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col">
        {/* Summary Stats with perfect symmetry */}
        {hasData && (
          <div className="mb-6 grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Best Emotion</div>
              <div className="text-xl font-semibold text-green-600">
                {validData.reduce((best, current) => 
                  current.avgProfitLoss > best.avgProfitLoss ? current : best
                ).emotion}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Worst Emotion</div>
              <div className="text-xl font-semibold text-red-600">
                {validData.reduce((worst, current) => 
                  current.avgProfitLoss < worst.avgProfitLoss ? current : worst
                ).emotion}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Total Emotions</div>
              <div className="text-xl font-semibold text-blue-600">
                {validData.length}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const x = margin.left + ratio * plotWidth;
              return (
                <line
                  key={index}
                  y1={margin.top}
                  x1={x}
                  y2={margin.top + plotHeight}
                  x2={x}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            })}

            {/* Bars */}
            {hasData && validData.map((item, index) => {
              const y = margin.top + index * totalBarHeight;
              const barWidth = maxProfitLoss > 0 ? (Math.abs(item.avgProfitLoss) / maxProfitLoss) * plotWidth : 0;
              const x = item.avgProfitLoss >= 0 ? 
                margin.left + plotWidth - barWidth : 
                margin.left;
              
              return (
                <g key={index}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={item.avgProfitLoss >= 0 ? '#10B981' : '#EF4444'}
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
                  
                  {/* Emotion label with proper spacing */}
                  <text
                    x={margin.left - 15}
                    y={y + barHeight / 2 + 5}
                    textAnchor="end"
                    className="text-sm fill-foreground font-medium"
                  >
                    {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
                  </text>
                  
                  {/* Value label with proper spacing */}
                  <text
                    x={x + (item.avgProfitLoss >= 0 ? barWidth + 8 : -8)}
                    y={y + barHeight / 2 + 5}
                    textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                    className="text-sm fill-foreground font-semibold"
                  >
                    ${item.avgProfitLoss.toFixed(0)}
                  </text>
                  
                  {/* Trade count with proper spacing */}
                  <text
                    x={x + (item.avgProfitLoss >= 0 ? barWidth + 8 : -8)}
                    y={y + barHeight / 2 + 18}
                    textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                    className="text-xs fill-muted-foreground"
                  >
                    {item.tradeCount} trades
                  </text>
                </g>
              );
            })}

            {/* X-axis labels with proper spacing */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = maxProfitLoss * (1 - ratio);
              const x = margin.left + ratio * plotWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  className="text-sm fill-muted-foreground font-medium"
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
