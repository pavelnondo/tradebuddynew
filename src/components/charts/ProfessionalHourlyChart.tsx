import React from 'react';

interface ProfessionalHourlyChartProps {
  data: Array<{ hour: number; profitLoss: number; winRate: number; tradeCount: number }>;
}

export function ProfessionalHourlyChart({ data }: ProfessionalHourlyChartProps) {
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
        !isNaN(item.hour) && 
        !isNaN(item.profitLoss) && 
        !isNaN(item.winRate)
      )
      .sort((a, b) => a.hour - b.hour);
  }, [data]);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Trading Data</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Start trading to see hourly performance</div>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const maxProfitLoss = Math.max(...validData.map(d => Math.abs(d.profitLoss)));
  const maxWinRate = Math.max(...validData.map(d => d.winRate));
  
  const chartHeight = 280;
  const barWidth = 28;
  const barSpacing = 12;
  const totalBarWidth = barWidth + barSpacing;
  const chartWidth = validData.length * totalBarWidth + 60;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Area */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Background pattern */}
          <defs>
            <pattern id="hourlyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.03"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hourlyGrid)" />
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="30"
              y1={30 + ratio * (chartHeight - 60)}
              x2={chartWidth - 30}
              y2={30 + ratio * (chartHeight - 60)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          ))}

          {/* Bars with improved styling */}
          {validData.map((item, index) => {
            const x = 30 + index * totalBarWidth;
            const barHeight = maxProfitLoss > 0 ? (Math.abs(item.profitLoss) / maxProfitLoss) * (chartHeight - 80) : 0;
            const y = item.profitLoss >= 0 ? 
              (chartHeight - 30) - barHeight : 
              (chartHeight - 30);
            
            return (
              <g key={index}>
                {/* Bar with gradient */}
                <defs>
                  <linearGradient id={`hourlyGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={item.profitLoss >= 0 ? "#10B981" : "#EF4444"} stopOpacity="0.8"/>
                    <stop offset="100%" stopColor={item.profitLoss >= 0 ? "#059669" : "#DC2626"} stopOpacity="1"/>
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#hourlyGradient${index})`}
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
                
                {/* Hour Label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="text-sm fill-slate-600 dark:fill-slate-400 font-medium"
                >
                  {item.hour}:00
                </text>
                
                {/* Value Label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-sm fill-slate-800 dark:fill-slate-200 font-bold"
                >
                  ${item.profitLoss.toFixed(0)}
                </text>
                
                {/* Trade count */}
                <text
                  x={x + barWidth / 2}
                  y={y - 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-500 dark:fill-slate-400"
                >
                  {item.tradeCount} trades
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const y = 30 + ratio * (chartHeight - 60);
            return (
              <text
                key={index}
                x="20"
                y={y + 4}
                textAnchor="end"
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
              <span className="text-slate-600 dark:text-slate-400">Best Hour: </span>
              <span className="font-semibold text-green-600">
                {validData.reduce((best, current) => 
                  current.profitLoss > best.profitLoss ? current : best
                ).hour}:00
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Worst Hour: </span>
              <span className="font-semibold text-red-600">
                {validData.reduce((worst, current) => 
                  current.profitLoss < worst.profitLoss ? current : worst
                ).hour}:00
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total Trades: </span>
            <span className="font-semibold text-blue-600">
              {validData.reduce((sum, item) => sum + item.tradeCount, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
