import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartData {
  [key: string]: any;
}

interface FixedChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'area';
  dataKey: string;
  title: string;
  width?: number;
  height?: number;
}

export const FixedChart: React.FC<FixedChartProps> = ({
  data,
  type,
  dataKey,
  title,
  width = 700,
  height = 500
}) => {
  const { themeConfig } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  // Extract values and calculate proper scaling
  const values = data.map(d => d[dataKey] || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Chart dimensions with proper margins - positioned closer to bottom left
  const margin = { top: 80, right: 80, bottom: 120, left: 120 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate Y-axis scaling with proper boundaries
  let yMin, yMax;
  if (minValue === maxValue) {
    // All values are the same
    yMin = minValue - Math.abs(minValue) * 0.1;
    yMax = maxValue + Math.abs(maxValue) * 0.1;
  } else {
    // Add 10% padding above and below
    const range = maxValue - minValue;
    const padding = range * 0.1;
    yMin = minValue - padding;
    yMax = maxValue + padding;
  }
  
  // For win/loss charts, ensure Y-axis starts at 0 and shows proper range
  if (type === 'bar' && (dataKey === 'value' || dataKey === 'count')) {
    yMin = 0;
    yMax = Math.max(maxValue * 1.2, 10); // At least 10, or 20% above max
  }

  // Ensure we have a valid range
  const yRange = yMax - yMin || 1;

  // Calculate Y position for a value
  const getY = (value: number) => {
    return margin.top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  };

  // Generate Y-axis labels
  const yAxisLabels = [];
  const numTicks = 6;
  for (let i = 0; i <= numTicks; i++) {
    const value = yMin + (yMax - yMin) * (i / numTicks);
    const y = getY(value);
    yAxisLabels.push({ value, y });
  }
  
  // For all charts, create cleaner Y-axis labels
  yAxisLabels.length = 0; // Clear existing labels
  
  if (type === 'bar' && (dataKey === 'value' || dataKey === 'count')) {
    // For win/loss charts, show 0, 20, 40, 60, 80, 100
    const maxVal = Math.ceil(yMax / 20) * 20; // Round up to nearest 20
    for (let i = 0; i <= 5; i++) {
      const value = (maxVal / 5) * i;
      const y = getY(value);
      yAxisLabels.push({ value, y });
    }
  } else {
    // For other charts, show 5-6 evenly spaced labels
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const value = yMin + (yMax - yMin) * (i / numTicks);
      const y = getY(value);
      yAxisLabels.push({ value, y });
    }
  }

  // Calculate points for the chart
  const points = data.map((d, index) => {
    const x = margin.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const value = d[dataKey] || 0;
    const y = getY(value);
    return {
      x,
      y,
      value,
      label: d.name || d.date || `Point ${index + 1}`,
      color: d.color // Pass color from data
    };
  });

  // Create path for line/area charts
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg width={width} height={height} className="overflow-hidden" viewBox={`0 0 ${width} ${height}`}>
        {/* Define clipping path for chart area */}
        <defs>
          <clipPath id="chartClip">
            <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} />
          </clipPath>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={themeConfig.primary} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={themeConfig.primary} stopOpacity="0.05"/>
          </linearGradient>
        </defs>

        {/* Chart content with clipping */}
        <g clipPath="url(#chartClip)">
          {/* Grid lines - improved visibility */}
        {yAxisLabels.map((label, index) => (
          <line
            key={index}
            x1={margin.left}
            y1={label.y}
            x2={margin.left + chartWidth}
            y2={label.y}
            stroke={themeConfig.foreground}
            strokeWidth="1"
            opacity="0.2"
          />
        ))}

        {/* Y-axis labels - improved positioning and visibility */}
        {yAxisLabels.map((label, index) => {
          let displayValue = '';
          if (dataKey === 'balance') {
            displayValue = `$${Math.round(label.value).toLocaleString()}`;
          } else if (dataKey === 'value') {
            displayValue = Math.round(label.value).toString();
          } else if (dataKey === 'pnl') {
            displayValue = `$${Math.round(label.value).toLocaleString()}`;
          } else if (dataKey === 'volume') {
            displayValue = Math.round(label.value).toLocaleString();
          } else {
            displayValue = label.value.toFixed(label.value < 1 ? 2 : 1);
          }
          
          return (
            <text
              key={index}
              x={margin.left - 20}
              y={label.y + 5}
              textAnchor="end"
              className="text-sm font-semibold"
              fill={themeConfig.foreground}
              opacity="0.9"
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            >
              {displayValue}
            </text>
          );
        })}

        {/* Y-axis title */}
        <text
          x={45}
          y={margin.top + chartHeight / 2}
          textAnchor="middle"
          className="text-sm font-semibold"
          fill={themeConfig.foreground}
          opacity="0.8"
          transform={`rotate(-90, 45, ${margin.top + chartHeight / 2})`}
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          {dataKey === 'balance' ? 'Balance ($)' : 
           dataKey === 'value' ? 'Count' : 
           dataKey === 'pnl' ? 'P&L ($)' : 
           dataKey === 'volume' ? 'Volume' : 
           dataKey === 'count' ? 'Count' : 
           'Value'}
        </text>

        {/* X-axis labels - improved positioning and visibility */}
        {points.map((point, index) => {
          // Format labels based on data type
          let displayLabel = point.label;
          if (point.label.includes('Trade')) {
            displayLabel = `T${index + 1}`;
          } else if (point.label.includes('-')) {
            // Date format - show month/day
            const dateParts = point.label.split('-');
            displayLabel = `${dateParts[1]}/${dateParts[2]}`;
          } else if (point.label === 'Wins') {
            displayLabel = 'Win';
          } else if (point.label === 'Losses') {
            displayLabel = 'Loss';
          } else if (point.label === 'Max Win') {
            displayLabel = 'Max Win';
          } else if (point.label === 'Max Loss') {
            displayLabel = 'Max Loss';
          } else if (point.label === 'Avg P&L') {
            displayLabel = 'Avg P&L';
          } else if (point.label.length > 8) {
            displayLabel = point.label.substring(0, 8) + '...';
          }
          
          return (
            <text
              key={index}
              x={point.x}
              y={margin.top + chartHeight + 40}
              textAnchor="middle"
              className="text-sm font-semibold"
              fill={themeConfig.foreground}
              opacity="0.9"
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            >
              {displayLabel}
            </text>
          );
        })}

        {/* X-axis title */}
        <text
          x={margin.left + chartWidth / 2}
          y={margin.top + chartHeight + 60}
          textAnchor="middle"
          className="text-sm font-semibold"
          fill={themeConfig.foreground}
          opacity="0.8"
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          {type === 'bar' ? 'Categories' : 'Time Period'}
        </text>

        {/* Chart content */}
        {type === 'area' && (
          <path
            d={`${pathData} L ${points[points.length - 1].x} ${margin.top + chartHeight} L ${margin.left} ${margin.top + chartHeight} Z`}
            fill="url(#areaGradient)"
          />
        )}

        {(type === 'line' || type === 'area') && (
          <path
            d={pathData}
            fill="none"
            stroke={themeConfig.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Bar chart rendering */}
        {type === 'bar' && points.map((point, index) => {
          const barWidth = chartWidth / points.length * 0.6;
          const barX = point.x - barWidth / 2;
          
          // Calculate bar height and position
          const baseline = getY(0); // Y position for zero value
          const barHeight = Math.abs(baseline - point.y);
          const barY = point.y < baseline ? point.y : baseline;
          
          const dataItem = data[index];
          const barColor = dataItem.color || themeConfig.primary;
          
          return (
            <rect
              key={index}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill={barColor}
              opacity="0.8"
              rx="3"
            />
          );
        })}

        {/* Data points for line/area charts */}
        {(type === 'line' || type === 'area') && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={themeConfig.primary}
            stroke={themeConfig.background}
            strokeWidth="2"
          />
        ))}

        {/* Data point labels for line charts */}
        {(type === 'line' || type === 'area') && points.map((point, index) => {
          let displayValue = '';
          if (dataKey === 'balance') {
            displayValue = `$${Math.round(point.value).toLocaleString()}`;
          } else if (dataKey === 'value') {
            displayValue = Math.round(point.value).toString();
          } else if (dataKey === 'pnl') {
            displayValue = `$${Math.round(point.value).toLocaleString()}`;
          } else if (dataKey === 'volume') {
            displayValue = Math.round(point.value).toLocaleString();
          } else {
            displayValue = point.value.toFixed(point.value < 1 ? 2 : 1);
          }
          
          return (
            <text
              key={`value-${index}`}
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              className="text-xs font-bold"
              fill={themeConfig.foreground}
              opacity="0.9"
            >
              {displayValue}
            </text>
          );
        })}

        </g>

        {/* Axes - outside clipping to always be visible - thickened for better visibility */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke={themeConfig.foreground}
          strokeWidth="4"
          opacity="0.8"
        />
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke={themeConfig.foreground}
          strokeWidth="4"
          opacity="0.8"
        />
        
        {/* Zero line for bar charts */}
        {type === 'bar' && yMin <= 0 && yMax >= 0 && (
          <line
            x1={margin.left}
            y1={getY(0)}
            x2={margin.left + chartWidth}
            y2={getY(0)}
            stroke={themeConfig.mutedForeground}
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Chart title - improved positioning and visibility */}
      <div className="absolute top-2 left-2 text-lg font-bold" style={{ color: themeConfig.foreground }}>
        {title}
      </div>

      {/* Data summary - positioned to avoid overlapping */}
      <div className="absolute top-2 right-2 text-xs bg-card border border-border rounded-lg px-3 py-2" style={{ color: themeConfig.mutedForeground }}>
        <div className="font-semibold mb-1">Metrics</div>
        <div>Max: {dataKey === 'balance' || dataKey === 'pnl' ? `$${Math.round(maxValue).toLocaleString()}` : Math.round(maxValue).toLocaleString()}</div>
        <div>Min: {dataKey === 'balance' || dataKey === 'pnl' ? `$${Math.round(minValue).toLocaleString()}` : Math.round(minValue).toLocaleString()}</div>
        <div>Range: {dataKey === 'balance' || dataKey === 'pnl' ? `$${Math.round(maxValue - minValue).toLocaleString()}` : Math.round(maxValue - minValue).toLocaleString()}</div>
        <div>Count: {data.length}</div>
      </div>

    </div>
  );
};
