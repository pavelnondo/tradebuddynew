import React from 'react';
import { UnifiedChart } from './UnifiedChart';

interface EmotionImpactChartProps {
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

export function EmotionImpactChart({ data, loading, error }: EmotionImpactChartProps) {
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

  if (!hasData && !loading && !error) {
    return (
      <UnifiedChart
        title="Emotion Impact"
        description="How emotions correlate with trading performance"
        loading={loading}
        error={error}
        noData={!hasData}
        noDataMessage={noDataMessage}
        height="lg"
      />
    );
  }

  // Calculate chart dimensions
  const maxProfitLoss = Math.max(...validData.map(d => Math.abs(d.avgProfitLoss)));
  const chartWidth = 500;
  const chartHeight = 320;
  const margin = { top: 20, right: 20, bottom: 40, left: 80 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar dimensions
  const barHeight = 35;
  const barSpacing = 15;
  const totalBarHeight = barHeight + barSpacing;

  return (
    <UnifiedChart
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
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Bars */}
          {validData.map((item, index) => {
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
                  y={y + barHeight - 6}
                  width={barWidth}
                  height="4"
                  fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                  opacity="0.9"
                  rx="2"
                />
                
                {/* Emotion label */}
                <text
                  x={margin.left - 10}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  className="text-sm fill-foreground font-medium"
                >
                  {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
                </text>
                
                {/* Value label */}
                <text
                  x={x + (item.avgProfitLoss >= 0 ? barWidth + 8 : -8)}
                  y={y + barHeight / 2 + 4}
                  textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                  className="text-sm fill-foreground font-semibold"
                >
                  ${item.avgProfitLoss.toFixed(0)}
                </text>
                
                {/* Trade count */}
                <text
                  x={x + (item.avgProfitLoss >= 0 ? barWidth + 8 : -8)}
                  y={y + barHeight / 2 + 16}
                  textAnchor={item.avgProfitLoss >= 0 ? 'start' : 'end'}
                  className="text-xs fill-muted-foreground"
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
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
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
    </UnifiedChart>
  );
}
