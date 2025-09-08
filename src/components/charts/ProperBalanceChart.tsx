import React from 'react';
import { ProperChart } from './ProperChart';

interface ProperBalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
  loading?: boolean;
  error?: string;
}

export function ProperBalanceChart({ balanceOverTime, loading, error }: ProperBalanceChartProps) {
  // Validate and process data
  const validData = React.useMemo(() => {
    if (!Array.isArray(balanceOverTime) || balanceOverTime.length === 0) {
      return [];
    }
    
    return balanceOverTime
      .filter(item => 
        item && 
        typeof item.date === 'string' && 
        typeof item.balance === 'number' && 
        !isNaN(item.balance) &&
        item.balance >= 0
      )
      .map(item => ({
        date: new Date(item.date).toISOString(),
        balance: Math.round(item.balance * 100) / 100,
        drawdown: item.drawdown ? Math.round(item.drawdown * 100) / 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [balanceOverTime]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades to see your balance progression over time';

  // Calculate chart dimensions with perfect proportions
  const minBalance = hasData ? Math.min(...validData.map(d => d.balance)) : 0;
  const maxBalance = hasData ? Math.max(...validData.map(d => d.balance)) : 10000;
  const balanceRange = maxBalance - minBalance;
  const padding = balanceRange * 0.1; // 10% padding
  
  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 30, right: 40, bottom: 50, left: 80 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Create smooth line path
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return '';
    
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
        // Last point - simple line
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  // Calculate points
  const points = hasData ? validData.map((item, index) => {
    const x = margin.left + (index / (validData.length - 1)) * plotWidth;
    const y = margin.top + plotHeight - ((item.balance - (minBalance - padding)) / (balanceRange + 2 * padding)) * plotHeight;
    return { x, y, ...item };
  }) : [];

  const linePath = hasData ? createSmoothPath(points) : '';
  const areaPath = hasData ? linePath + ` L ${points[points.length - 1].x} ${margin.top + plotHeight} L ${points[0].x} ${margin.top + plotHeight} Z` : '';

  // Y-axis labels
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = minBalance - padding + (balanceRange + 2 * padding) * (1 - ratio);
    const y = margin.top + plotHeight * ratio;
    return { value: Math.round(value), y };
  });

  // X-axis labels (show first, middle, last dates)
  const xAxisLabels = [];
  if (hasData && validData.length > 0) {
    xAxisLabels.push({
      label: new Date(validData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      x: margin.left
    });
    
    if (validData.length > 1) {
      const midIndex = Math.floor(validData.length / 2);
      xAxisLabels.push({
        label: new Date(validData[midIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x: margin.left + plotWidth / 2
      });
    }
    
    if (validData.length > 2) {
      xAxisLabels.push({
        label: new Date(validData[validData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x: margin.left + plotWidth
      });
    }
  }

  return (
    <ProperChart
      title="Balance Over Time"
      description="Your account balance progression"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col">
        {/* Current balance display with perfect symmetry */}
        {hasData && (
          <div className="mb-6 flex justify-between items-center px-2">
            <div className="text-center flex-1">
              <div className="text-3xl font-bold text-foreground">
                ${validData[validData.length - 1].balance.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Current Balance</div>
            </div>
            <div className="text-center flex-1">
              <div className={`text-2xl font-semibold ${validData[validData.length - 1].balance >= validData[0].balance ? 'text-green-600' : 'text-red-600'}`}>
                {validData[validData.length - 1].balance >= validData[0].balance ? '+' : ''}
                ${(validData[validData.length - 1].balance - validData[0].balance).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Change</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Grid lines */}
            {yAxisLabels.map((label, index) => (
              <line
                key={index}
                x1={margin.left}
                y1={label.y}
                x2={margin.left + plotWidth}
                y2={label.y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            
            {/* Area fill */}
            {hasData && (
              <path
                d={areaPath}
                fill="url(#balanceGradient)"
                opacity="0.2"
              />
            )}
            
            {/* Line */}
            {hasData && (
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Data points */}
            {hasData && points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className="hover:r-5 transition-all duration-200"
              />
            ))}
            
            {/* Y-axis labels with proper spacing */}
            {yAxisLabels.map((label, index) => (
              <text
                key={index}
                x={margin.left - 15}
                y={label.y + 5}
                textAnchor="end"
                className="text-sm fill-muted-foreground font-medium"
              >
                ${label.value.toLocaleString()}
              </text>
            ))}
            
            {/* X-axis labels with proper spacing */}
            {xAxisLabels.map((label, index) => (
              <text
                key={index}
                x={label.x}
                y={chartHeight - 15}
                textAnchor="middle"
                className="text-sm fill-muted-foreground font-medium"
              >
                {label.label}
              </text>
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </ProperChart>
  );
}
