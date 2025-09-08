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
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl">
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
  const chartHeight = 200;
  const barHeight = 30;
  const barSpacing = 8;
  const totalBarHeight = barHeight + barSpacing;
  const chartWidth = 300;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Chart Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Emotion Impact</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">How emotions correlate with performance</p>
      </div>

      {/* Chart */}
      <div className="w-full">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              y1="20"
              x1={20 + ratio * (chartWidth - 40)}
              y2={chartHeight - 20}
              x2={20 + ratio * (chartWidth - 40)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          ))}

          {/* Bars */}
          {validData.map((item, index) => {
            const y = 20 + index * totalBarHeight;
            const barWidth = maxProfitLoss > 0 ? (Math.abs(item.avgProfitLoss) / maxProfitLoss) * (chartWidth - 80) : 0;
            const x = item.avgProfitLoss >= 0 ? 
              20 : 
              (20 + (chartWidth - 40) - barWidth);
            
            return (
              <g key={index}>
                {/* P&L Bar */}
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
                  x="10"
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-600 dark:fill-slate-400 font-medium"
                >
                  {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
                </text>
                
                {/* Value Label */}
                <text
                  x={x + barWidth + 5}
                  y={y + barHeight / 2 + 4}
                  textAnchor="start"
                  className="text-xs fill-slate-700 dark:fill-slate-300 font-semibold"
                >
                  ${item.avgProfitLoss.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const x = 20 + ratio * (chartWidth - 40);
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="text-xs fill-slate-600 dark:fill-slate-400"
              >
                ${value.toFixed(0)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Best Emotion</div>
          <div className="text-lg font-bold text-green-600">
            {validData.reduce((best, current) => 
              current.avgProfitLoss > best.avgProfitLoss ? current : best
            ).emotion}
          </div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Emotions</div>
          <div className="text-lg font-bold text-purple-600">
            {validData.length}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Profitable</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Loss</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-1 bg-green-600 rounded"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Win Rate ≥50%</span>
        </div>
      </div>
    </div>
  );
}
