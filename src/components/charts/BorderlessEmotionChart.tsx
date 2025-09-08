import React from 'react';
import { BorderlessChart } from './BorderlessChart';

interface BorderlessEmotionChartProps {
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

export function BorderlessEmotionChart({ data, loading, error }: BorderlessEmotionChartProps) {
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

  // Calculate chart dimensions - use full available space
  const maxProfitLoss = hasData ? Math.max(...validData.map(d => Math.abs(d.avgProfitLoss))) : 1000;
  const chartWidth = 100; // Use percentage
  const chartHeight = 100; // Use percentage
  const margin = { top: 5, right: 5, bottom: 15, left: 20 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar dimensions
  const barHeight = 8;
  const barSpacing = 2;
  const totalBarHeight = barHeight + barSpacing;

  return (
    <BorderlessChart
      title="Emotion Impact"
      description="How emotions correlate with trading performance"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
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
                strokeWidth="0.2"
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
                
                {/* Emotion label */}
                <text
                  x={margin.left - 2}
                  y={y + barHeight / 2 + 1}
                  textAnchor="end"
                  className="text-xs fill-foreground font-medium"
                  fontSize="2"
                >
                  {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
                </text>
                
                {/* Value label */}
                <text
                  x={x + (item.avgProfitLoss >= 0 ? barWidth + 1 : -1)}
                  y={y + barHeight / 2 + 1}
                  textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                  className="text-xs fill-foreground font-semibold"
                  fontSize="2"
                >
                  ${item.avgProfitLoss.toFixed(0)}
                </text>
                
                {/* Trade count */}
                <text
                  x={x + (item.avgProfitLoss >= 0 ? barWidth + 1 : -1)}
                  y={y + barHeight / 2 + 3}
                  textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                  className="text-xs fill-muted-foreground"
                  fontSize="1.5"
                >
                  {item.tradeCount} trades
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const x = margin.left + ratio * plotWidth;
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - 2}
                textAnchor="middle"
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
                  <span className="text-muted-foreground">Best Emotion: </span>
                  <span className="font-semibold text-green-600">
                    {validData.reduce((best, current) => 
                      current.avgProfitLoss > best.avgProfitLoss ? current : best
                    ).emotion}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Worst Emotion: </span>
                  <span className="font-semibold text-red-600">
                    {validData.reduce((worst, current) => 
                      current.avgProfitLoss < worst.avgProfitLoss ? current : worst
                    ).emotion}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Emotions: </span>
                <span className="font-semibold text-foreground">
                  {validData.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </BorderlessChart>
  );
}
