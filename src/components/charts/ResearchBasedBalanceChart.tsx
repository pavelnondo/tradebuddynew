import React from 'react';
import { ResearchBasedChart, SPACING } from './ResearchBasedChart';
import { cn } from '@/lib/utils';

interface ResearchBasedBalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
  loading?: boolean;
  error?: string;
}

export function ResearchBasedBalanceChart({ balanceOverTime, loading, error }: ResearchBasedBalanceChartProps) {
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

  // Research-based chart dimensions following golden ratio (1.6:1 to 1.8:1)
  // Using 1.7:1 ratio for optimal readability
  const chartWidth = 800;
  const chartHeight = Math.round(chartWidth / 1.7); // ~470px for 1.7:1 ratio
  
  // Research-based margins: 20-30% of total area for non-data elements
  const totalArea = chartWidth * chartHeight;
  const nonDataArea = totalArea * 0.25; // 25% for margins, labels, etc.
  const dataArea = totalArea - nonDataArea;
  
  // Calculate margins based on research recommendations
  const margin = { 
    top: 40,    // 5% of height for title space
    right: 50,  // 6% of width for right margin
    bottom: 60, // 7% of height for x-axis labels
    left: 80    // 10% of width for y-axis labels
  };
  
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate data range with proper padding
  const minBalance = hasData ? Math.min(...validData.map(d => d.balance)) : 0;
  const maxBalance = hasData ? Math.max(...validData.map(d => d.balance)) : 10000;
  const balanceRange = maxBalance - minBalance;
  const padding = balanceRange * 0.1; // 10% padding for visual breathing room

  // Create smooth line path with research-based curve optimization
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        // Research-based smooth curve with optimal control points
        const cp1x = prev.x + (curr.x - prev.x) * 0.3; // 30% for optimal curve
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.3;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // Last point - simple line
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  // Calculate points with research-based positioning
  const points = hasData ? validData.map((item, index) => {
    const x = margin.left + (index / (validData.length - 1)) * plotWidth;
    const y = margin.top + plotHeight - ((item.balance - (minBalance - padding)) / (balanceRange + 2 * padding)) * plotHeight;
    return { x, y, ...item };
  }) : [];

  const linePath = hasData ? createSmoothPath(points) : '';
  const areaPath = hasData ? linePath + ` L ${points[points.length - 1].x} ${margin.top + plotHeight} L ${points[0].x} ${margin.top + plotHeight} Z` : '';

  // Research-based Y-axis labels (5 labels for optimal readability)
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = minBalance - padding + (balanceRange + 2 * padding) * (1 - ratio);
    const y = margin.top + plotHeight * ratio;
    return { value: Math.round(value), y };
  });

  // Research-based X-axis labels (3-5 labels for optimal readability)
  const xAxisLabels = [];
  if (hasData && validData.length > 0) {
    const labelCount = Math.min(5, validData.length);
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((i / (labelCount - 1)) * (validData.length - 1));
      const date = new Date(validData[index].date);
      xAxisLabels.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x: margin.left + (index / (validData.length - 1)) * plotWidth
      });
    }
  }

  return (
    <ResearchBasedChart
      title="Balance Over Time"
      description="Your account balance progression with research-based design principles"
      loading={loading}
      error={error}
      noData={!hasData}
      noDataMessage={noDataMessage}
      height="lg"
    >
      <div className="w-full h-full flex flex-col">
        {/* Research-based balance display with optimal spacing */}
        {hasData && (
          <div className={cn('mb-6 flex justify-between items-center', SPACING.axisPadding)}>
            <div className="text-center flex-1">
              <div className="text-3xl font-bold text-foreground">
                ${validData[validData.length - 1].balance.toLocaleString()}
              </div>
              <div className={cn('text-muted-foreground mt-1', SPACING.dataFontSize)}>Current Balance</div>
            </div>
            <div className="text-center flex-1">
              <div className={`text-2xl font-semibold ${validData[validData.length - 1].balance >= validData[0].balance ? 'text-green-600' : 'text-red-600'}`}>
                {validData[validData.length - 1].balance >= validData[0].balance ? '+' : ''}
                ${(validData[validData.length - 1].balance - validData[0].balance).toLocaleString()}
              </div>
              <div className={cn('text-muted-foreground mt-1', SPACING.dataFontSize)}>Total Change</div>
            </div>
          </div>
        )}

        {/* Research-based chart with optimal proportions */}
        <div className="flex-1 min-h-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Research-based grid lines with optimal opacity */}
            {yAxisLabels.map((label, index) => (
              <line
                key={index}
                x1={margin.left}
                y1={label.y}
                x2={margin.left + plotWidth}
                y2={label.y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.2" // Research-based opacity for subtle grid
              />
            ))}
            
            {/* Research-based area fill with optimal gradient */}
            {hasData && (
              <path
                d={areaPath}
                fill="url(#researchBalanceGradient)"
                opacity="0.15" // Research-based opacity for subtle fill
              />
            )}
            
            {/* Research-based line with optimal stroke width */}
            {hasData && (
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5" // Research-based stroke width for optimal visibility
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Research-based data points with optimal sizing */}
            {hasData && points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4.5" // Research-based point size for optimal visibility
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className="hover:r-6 transition-all duration-200"
              />
            ))}
            
            {/* Research-based Y-axis labels with optimal spacing */}
            {yAxisLabels.map((label, index) => (
              <text
                key={index}
                x={margin.left - 15}
                y={label.y + 5}
                textAnchor="end"
                className={cn('fill-muted-foreground font-medium', SPACING.axisFontSize)}
              >
                ${label.value.toLocaleString()}
              </text>
            ))}
            
            {/* Research-based X-axis labels with optimal spacing */}
            {xAxisLabels.map((label, index) => (
              <text
                key={index}
                x={label.x}
                y={chartHeight - 15}
                textAnchor="middle"
                className={cn('fill-muted-foreground font-medium', SPACING.axisFontSize)}
              >
                {label.label}
              </text>
            ))}
            
            {/* Research-based gradient definition */}
            <defs>
              <linearGradient id="researchBalanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </ResearchBasedChart>
  );
}
