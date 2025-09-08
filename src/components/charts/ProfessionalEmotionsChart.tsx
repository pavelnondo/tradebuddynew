import React from 'react';

interface ProfessionalEmotionsChartProps {
  data: Array<{ emotion: string; avgProfitLoss: number; winRate: number; tradeCount: number }>;
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

export function ProfessionalEmotionsChart({ data }: ProfessionalEmotionsChartProps) {
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
        !isNaN(item.tradeCount)
      )
      .sort((a, b) => b.avgProfitLoss - a.avgProfitLoss);
  }, [data]);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Emotion Data</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Add trades with emotions to see emotional patterns</div>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const maxProfitLoss = Math.max(...validData.map(d => Math.abs(d.avgProfitLoss)));
  const chartHeight = 320;
  const barHeight = 40;
  const barSpacing = 15;
  const totalBarHeight = barHeight + barSpacing;
  const chartWidth = 500;

  return (
    <div className="w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            y1="40"
            x1={40 + ratio * (chartWidth - 80)}
            y2={chartHeight - 40}
            x2={40 + ratio * (chartWidth - 80)}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />
        ))}

        {/* Bars */}
        {validData.map((item, index) => {
          const y = 40 + index * totalBarHeight;
          const barWidth = maxProfitLoss > 0 ? (Math.abs(item.avgProfitLoss) / maxProfitLoss) * (chartWidth - 160) : 0;
          const x = item.avgProfitLoss >= 0 ? 
            40 : 
            (40 + (chartWidth - 80) - barWidth);
          
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
                className="transition-all duration-300 hover:opacity-100"
                rx="4"
              />
              
              {/* Win Rate Indicator */}
              <rect
                x={x}
                y={y + barHeight - 6}
                width={barWidth}
                height="4"
                fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                opacity="0.9"
                rx="2"
              />
              
              {/* Emotion Label */}
              <text
                x="20"
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                className="text-sm fill-slate-700 dark:fill-slate-300 font-medium"
              >
                {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
              </text>
              
              {/* Value Label */}
              <text
                x={x + barWidth + 8}
                y={y + barHeight / 2 + 4}
                textAnchor="start"
                className="text-sm fill-slate-800 dark:fill-slate-200 font-bold"
              >
                ${item.avgProfitLoss.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const value = maxProfitLoss * (1 - ratio);
          const x = 40 + ratio * (chartWidth - 80);
          return (
            <text
              key={index}
              x={x}
              y={chartHeight - 15}
              textAnchor="middle"
              className="text-xs fill-slate-600 dark:fill-slate-400"
            >
              ${value.toFixed(0)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
