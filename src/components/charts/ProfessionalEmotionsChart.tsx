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
  const chartHeight = 280;
  const barHeight = 35;
  const barSpacing = 12;
  const totalBarHeight = barHeight + barSpacing;
  const chartWidth = 400;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Area */}
      <div className="flex-1 min-h-0">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Background pattern */}
          <defs>
            <pattern id="emotionGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.03"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#emotionGrid)" />
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              y1="30"
              x1={30 + ratio * (chartWidth - 60)}
              y2={chartHeight - 30}
              x2={30 + ratio * (chartWidth - 60)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          ))}

          {/* Bars with improved styling */}
          {validData.map((item, index) => {
            const y = 30 + index * totalBarHeight;
            const barWidth = maxProfitLoss > 0 ? (Math.abs(item.avgProfitLoss) / maxProfitLoss) * (chartWidth - 120) : 0;
            const x = item.avgProfitLoss >= 0 ? 
              30 : 
              (30 + (chartWidth - 60) - barWidth);
            
            return (
              <g key={index}>
                {/* Bar with gradient */}
                <defs>
                  <linearGradient id={`emotionGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={item.avgProfitLoss >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0.8"/>
                    <stop offset="100%" stopColor={item.avgProfitLoss >= 0 ? "#059669" : "#DC2626"} stopOpacity="1"/>
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#emotionGradient${index})`}
                  rx="6"
                  className="transition-all duration-300 hover:opacity-100 drop-shadow-sm"
                />
                
                {/* Win Rate Indicator */}
                <rect
                  x={x}
                  y={y + barHeight - 8}
                  width={barWidth}
                  height="6"
                  fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                  opacity="0.9"
                  rx="3"
                />
                
                {/* Emotion Label */}
                <text
                  x="15"
                  y={y + barHeight / 2 + 5}
                  textAnchor="end"
                  className="text-sm fill-slate-700 dark:fill-slate-300 font-medium"
                >
                  {emotionIcons[item.emotion.toLowerCase()] || '😐'} {item.emotion}
                </text>
                
                {/* Value Label */}
                <text
                  x={x + barWidth + 10}
                  y={y + barHeight / 2 + 5}
                  textAnchor="start"
                  className="text-sm fill-slate-800 dark:fill-slate-200 font-bold"
                >
                  ${item.avgProfitLoss.toFixed(0)}
                </text>
                
                {/* Trade count */}
                <text
                  x={x + barWidth + 10}
                  y={y + barHeight / 2 + 18}
                  textAnchor="start"
                  className="text-xs fill-slate-500 dark:fill-slate-400"
                >
                  {item.tradeCount} trades
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const x = 30 + ratio * (chartWidth - 60);
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-slate-600 dark:fill-slate-400"
              >
                ${value.toFixed(0)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Best: </span>
              <span className="font-semibold text-green-600">
                {validData.reduce((best, current) => 
                  current.avgProfitLoss > best.avgProfitLoss ? current : best
                ).emotion}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Worst: </span>
              <span className="font-semibold text-red-600">
                {validData.reduce((worst, current) => 
                  current.avgProfitLoss < worst.avgProfitLoss ? current : worst
                ).emotion}
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total: </span>
            <span className="font-semibold text-blue-600">
              {validData.length} emotions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
