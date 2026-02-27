import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BasicChartProps {
  data: any[];
  dataKey: string;
  type: 'line' | 'bar' | 'area';
  width?: number;
  height?: number;
  className?: string;
  title?: string;
}

export const BasicChart: React.FC<BasicChartProps> = ({
  data,
  dataKey,
  type,
  width = 400,
  height = 200,
  className = '',
  title
}) => {
  const { themeConfig } = useTheme();
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  // Get min and max values for scaling
  const values = data.map(d => d[dataKey] || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Chart dimensions with padding for axes
  const chartWidth = width - 80;
  const chartHeight = height - 80;
  const chartX = 60;
  const chartY = 30;

  // Calculate points for the chart
  const points = data.map((d, index) => {
    const x = chartX + (index / (data.length - 1)) * chartWidth;
    const y = chartY + chartHeight - ((d[dataKey] - minValue) / range) * chartHeight;
    return { x, y, value: d[dataKey], label: d.date || d.name || `Item ${index + 1}` };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${chartY + chartHeight} L ${chartX} ${chartY + chartHeight} Z`;

  // Generate Y-axis labels
  const yAxisLabels = [];
  const numLabels = 5;
  for (let i = 0; i <= numLabels; i++) {
    const value = minValue + (range * i) / numLabels;
    const y = chartY + chartHeight - (i / numLabels) * chartHeight;
    yAxisLabels.push({ value, y });
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {title && (
        <div className="text-center text-sm font-medium mb-2" style={{ 
          color: themeConfig.foreground,
          textShadow: `0 0 8px ${themeConfig.glow}`,
          opacity: 0.8
        }}>
          {title}
        </div>
      )}
      
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
          </pattern>
        </defs>
        
        {/* Y-axis grid lines */}
        {yAxisLabels.map((label, index) => (
          <line
            key={index}
            x1={chartX}
            y1={label.y}
            x2={chartX + chartWidth}
            y2={label.y}
            stroke={themeConfig.grid}
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}
        
        {/* X-axis grid lines */}
        {points.map((point, index) => (
          <line
            key={index}
            x1={point.x}
            y1={chartY}
            x2={point.x}
            y2={chartY + chartHeight}
            stroke={themeConfig.grid}
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}
        
        {/* Bar charts */}
        {type === 'bar' && points.map((point, index) => {
          const barWidth = chartWidth / points.length * 0.8;
          const barX = point.x - barWidth / 2;
          const barHeight = chartY + chartHeight - point.y;
          return (
            <rect
              key={index}
              x={barX}
              y={point.y}
              width={barWidth}
              height={barHeight}
              fill={themeConfig.chartBar}
              opacity="0.8"
            />
          );
        })}
        
        {/* Area fill for area charts */}
        {type === 'area' && (
          <path
            d={areaPathData}
            fill="url(#areaGradient)"
            opacity="0.3"
          />
        )}
        
        {/* Line or area path */}
        {(type === 'line' || type === 'area') && (
          <path
            d={pathData}
            fill="none"
            stroke={themeConfig.chartLine}
            strokeWidth="2"
          />
        )}
        
        {/* Data points */}
        {type !== 'bar' && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={themeConfig.chartLine}
          />
        ))}
        
        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <text
            key={index}
            x={chartX - 10}
            y={label.y + 4}
            textAnchor="end"
            className="text-xs"
            fill={themeConfig.mutedForeground}
          >
            {label.value.toFixed(1)}
          </text>
        ))}
        
        {/* X-axis labels */}
        {points.map((point, index) => (
          index % Math.ceil(points.length / 5) === 0 && (
            <text
              key={index}
              x={point.x}
              y={chartY + chartHeight + 20}
              textAnchor="middle"
              className="text-xs"
              fill={themeConfig.mutedForeground}
            >
              {point.label.length > 6 ? point.label.substring(0, 6) + '...' : point.label}
            </text>
          )
        ))}
        
        {/* Axes */}
        <line
          x1={chartX}
          y1={chartY}
          x2={chartX}
          y2={chartY + chartHeight}
          stroke={themeConfig.border}
          strokeWidth="1"
        />
        <line
          x1={chartX}
          y1={chartY + chartHeight}
          x2={chartX + chartWidth}
          y2={chartY + chartHeight}
          stroke={themeConfig.border}
          strokeWidth="1"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={themeConfig.chartArea} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={themeConfig.chartArea} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
      </svg>
      
      {/* Data summary */}
      <div className="absolute top-2 right-2 text-xs" style={{ color: themeConfig.mutedForeground }}>
        <div>Max: {maxValue.toFixed(2)}</div>
        <div>Min: {minValue.toFixed(2)}</div>
        <div>Count: {data.length}</div>
      </div>
    </div>
  );
};
