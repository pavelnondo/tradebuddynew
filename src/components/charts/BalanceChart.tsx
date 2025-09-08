import React from 'react';
import { UnifiedChart } from './UnifiedChart';

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
  loading?: boolean;
  error?: string;
}

export function BalanceChart({ balanceOverTime, loading, error }: BalanceChartProps) {
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

  if (!hasData && !loading && !error) {
    return (
      <UnifiedChart
        title="Balance Over Time"
        description="Your account balance progression"
        loading={loading}
        error={error}
        noData={!hasData}
        noDataMessage={noDataMessage}
        height="lg"
      />
    );
  }

  // Calculate chart dimensions
  const minBalance = Math.min(...validData.map(d => d.balance));
  const maxBalance = Math.max(...validData.map(d => d.balance));
  const balanceRange = maxBalance - minBalance;
  const padding = balanceRange * 0.1; // 10% padding
  
  const chartWidth = 400;
  const chartHeight = 280;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
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
  const points = validData.map((item, index) => {
    const x = margin.left + (index / (validData.length - 1)) * plotWidth;
    const y = margin.top + plotHeight - ((item.balance - (minBalance - padding)) / (balanceRange + 2 * padding)) * plotHeight;
    return { x, y, ...item };
  });

  const linePath = createSmoothPath(points);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${margin.top + plotHeight} L ${points[0].x} ${margin.top + plotHeight} Z`;

  // Y-axis labels
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = minBalance - padding + (balanceRange + 2 * padding) * (1 - ratio);
    const y = margin.top + plotHeight * ratio;
    return { value: Math.round(value), y };
  });

  // X-axis labels (show first, middle, last dates)
  const xAxisLabels = [];
  if (validData.length > 0) {
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
    <UnifiedChart
      title="Balance Over Time"
      description="Your account balance progression"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full">
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
          <path
            d={areaPath}
            fill="url(#balanceGradient)"
            opacity="0.2"
          />
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="hsl(var(--primary))"
              className="hover:r-4 transition-all duration-200"
            />
          ))}
          
          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => (
            <text
              key={index}
              x={margin.left - 10}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-muted-foreground"
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
              className="text-xs fill-muted-foreground"
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
        
        {/* Current balance display */}
        {hasData && (
          <div className="mt-4 flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">Current Balance: </span>
              <span className="font-semibold text-foreground">
                ${validData[validData.length - 1].balance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Change: </span>
              <span className={`font-semibold ${validData[validData.length - 1].balance >= validData[0].balance ? 'text-green-600' : 'text-red-600'}`}>
                {validData[validData.length - 1].balance >= validData[0].balance ? '+' : ''}
                ${(validData[validData.length - 1].balance - validData[0].balance).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </UnifiedChart>
  );
}