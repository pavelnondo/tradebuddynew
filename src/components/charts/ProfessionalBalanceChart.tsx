import React from 'react';

interface ProfessionalBalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
}

export function ProfessionalBalanceChart({ balanceOverTime }: ProfessionalBalanceChartProps) {
  // Validate and process data
  const validData = React.useMemo(() => {
    if (!Array.isArray(balanceOverTime) || balanceOverTime.length === 0) {
      return [];
    }
    
    return balanceOverTime
      .filter(item => item && typeof item.balance === 'number' && !isNaN(item.balance))
      .map(item => ({
        date: new Date(item.date),
        balance: item.balance,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [balanceOverTime]);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Trading Data</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Start trading to see your balance progression</div>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scales
  const minBalance = Math.min(...validData.map(d => d.balance));
  const maxBalance = Math.max(...validData.map(d => d.balance));
  const balanceRange = maxBalance - minBalance;
  const padding = balanceRange * 0.1; // 10% padding
  
  const chartWidth = 400;
  const chartHeight = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Create smooth path for the line
  const createSmoothPath = () => {
    if (validData.length < 2) return '';
    
    const points = validData.map((point, index) => {
      const x = margin.left + (index / (validData.length - 1)) * plotWidth;
      const y = margin.top + plotHeight - ((point.balance - (minBalance - padding)) / (balanceRange + 2 * padding)) * plotHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        // Smooth curve with control points
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) / 3;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // Last point
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        path += ` C ${cp1x} ${cp1y}, ${curr.x} ${curr.y}, ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  // Create area path
  const createAreaPath = () => {
    const linePath = createSmoothPath();
    if (!linePath) return '';
    
    const lastPoint = validData[validData.length - 1];
    const lastX = margin.left + plotWidth;
    const bottomY = margin.top + plotHeight;
    
    return `${linePath} L ${lastX} ${bottomY} L ${margin.left} ${bottomY} Z`;
  };

  // Generate Y-axis labels
  const yAxisLabels = [];
  const numLabels = 5;
  for (let i = 0; i < numLabels; i++) {
    const value = minBalance - padding + (balanceRange + 2 * padding) * (i / (numLabels - 1));
    const y = margin.top + plotHeight - (i / (numLabels - 1)) * plotHeight;
    yAxisLabels.push({ value, y });
  }

  // Generate X-axis labels
  const xAxisLabels = [];
  const numXLabels = Math.min(5, validData.length);
  for (let i = 0; i < numXLabels; i++) {
    const index = Math.floor((i / (numXLabels - 1)) * (validData.length - 1));
    const x = margin.left + (index / (validData.length - 1)) * plotWidth;
    xAxisLabels.push({ 
      label: validData[index].displayDate, 
      x 
    });
  }

  return (
    <div className="w-full h-full">
      {/* Current Balance Display */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            ${validData[validData.length - 1].balance.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {validData.length > 1 && (
              <span className={validData[validData.length - 1].balance >= validData[0].balance ? 'text-green-600' : 'text-red-600'}>
                {validData[validData.length - 1].balance >= validData[0].balance ? '+' : ''}
                ${(validData[validData.length - 1].balance - validData[0].balance).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {yAxisLabels.map((label, index) => (
            <g key={index}>
              <line
                x1={margin.left}
                y1={label.y}
                x2={margin.left + plotWidth}
                y2={label.y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.1"
              />
            </g>
          ))}

          {/* Area fill */}
          <path
            d={createAreaPath()}
            fill="url(#balanceGradient)"
            opacity="0.3"
          />

          {/* Line */}
          <path
            d={createSmoothPath()}
            fill="none"
            stroke="url(#balanceLineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {validData.map((point, index) => {
            const x = margin.left + (index / (validData.length - 1)) * plotWidth;
            const y = margin.top + plotHeight - ((point.balance - (minBalance - padding)) / (balanceRange + 2 * padding)) * plotHeight;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="url(#balanceLineGradient)"
                stroke="white"
                strokeWidth="2"
                className="hover:r-6 transition-all duration-200 cursor-pointer"
              />
            );
          })}

          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => (
            <text
              key={index}
              x={margin.left - 10}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-slate-600 dark:fill-slate-400"
            >
              ${label.value.toLocaleString()}
            </text>
          ))}

          {/* X-axis labels */}
          {xAxisLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-slate-600 dark:fill-slate-400"
            >
              {label.label}
            </text>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="balanceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
