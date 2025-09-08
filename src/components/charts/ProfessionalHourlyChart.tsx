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
  
  const chartHeight = 320;
  const barWidth = 40;
  const barSpacing = 15;
  const totalBarWidth = barWidth + barSpacing;
  const chartWidth = Math.max(600, validData.length * totalBarWidth + 80);

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1="40"
            y1={40 + ratio * (chartHeight - 80)}
            x2={chartWidth - 40}
            y2={40 + ratio * (chartHeight - 80)}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />
        ))}

        {/* Bars */}
        {validData.map((item, index) => {
          const x = 40 + index * totalBarWidth;
          const barHeight = maxProfitLoss > 0 ? (Math.abs(item.profitLoss) / maxProfitLoss) * (chartHeight - 100) : 0;
          const y = item.profitLoss >= 0 ? 
            (chartHeight - 40) - barHeight : 
            (chartHeight - 40);
          
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
              
              {/* Hour Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 15}
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
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const value = maxProfitLoss * (1 - ratio);
          const y = 40 + ratio * (chartHeight - 80);
          return (
            <text
              key={index}
              x="25"
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
  );
}
