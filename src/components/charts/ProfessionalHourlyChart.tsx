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
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl">
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
  
  const chartHeight = 200;
  const barWidth = 20;
  const barSpacing = 8;
  const totalBarWidth = barWidth + barSpacing;
  const chartWidth = validData.length * totalBarWidth + 40;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Chart Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Hourly Performance</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Profit/Loss and win rate by hour</p>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="20"
              y1={20 + ratio * (chartHeight - 40)}
              x2={chartWidth - 20}
              y2={20 + ratio * (chartHeight - 40)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          ))}

          {/* Bars */}
          {validData.map((item, index) => {
            const x = 20 + index * totalBarWidth;
            const barHeight = maxProfitLoss > 0 ? (Math.abs(item.profitLoss) / maxProfitLoss) * (chartHeight - 60) : 0;
            const y = item.profitLoss >= 0 ? 
              (chartHeight - 20) - barHeight : 
              (chartHeight - 20);
            
            return (
              <g key={index}>
                {/* P&L Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.profitLoss >= 0 ? '#10B981' : '#EF4444'}
                  opacity="0.8"
                  className="transition-all duration-300 hover:opacity-100"
                />
                
                {/* Win Rate Indicator */}
                <rect
                  x={x + 2}
                  y={y - 8}
                  width={barWidth - 4}
                  height="4"
                  fill={item.winRate >= 50 ? '#059669' : '#DC2626'}
                  opacity="0.9"
                />
                
                {/* Hour Label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-600 dark:fill-slate-400"
                >
                  {item.hour}:00
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = maxProfitLoss * (1 - ratio);
            const y = 20 + ratio * (chartHeight - 40);
            return (
              <text
                key={index}
                x="15"
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

      {/* Legend and Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Best Hour</div>
          <div className="text-lg font-bold text-green-600">
            {validData.reduce((best, current) => 
              current.profitLoss > best.profitLoss ? current : best
            ).hour}:00
          </div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Trades</div>
          <div className="text-lg font-bold text-blue-600">
            {validData.reduce((sum, item) => sum + item.tradeCount, 0)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Profit</span>
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
