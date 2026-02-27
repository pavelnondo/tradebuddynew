import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfessionalChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKey: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const ProfessionalChart: React.FC<ProfessionalChartProps> = ({
  data,
  type,
  dataKey,
  title,
  width = 400,
  height = 300,
  className = ''
}) => {
  const { themeConfig } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm text-muted-foreground">No data available</div>
        </div>
      </div>
    );
  }

  const values = data.map(d => d[dataKey] || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
    // Improve Y-axis scaling for better bar positioning
    const range = maxValue - minValue;
    const padding = type === 'bar' ? range * 0.2 : range * 0.1; // More padding for bar charts
  
  // Handle special cases for better scaling
  let adjustedMinValue, adjustedMaxValue;
  if (minValue === maxValue) {
    // All values are the same
    adjustedMinValue = minValue - Math.abs(minValue) * 0.1;
    adjustedMaxValue = maxValue + Math.abs(maxValue) * 0.1;
  } else if (minValue >= 0) {
    // All positive values
    adjustedMinValue = Math.max(0, minValue - padding);
    adjustedMaxValue = maxValue + padding;
  } else if (maxValue <= 0) {
    // All negative values
    adjustedMinValue = minValue - padding;
    adjustedMaxValue = Math.min(0, maxValue + padding);
  } else {
    // Mixed positive and negative values
    adjustedMinValue = minValue - padding;
    adjustedMaxValue = maxValue + padding;
  }
  
  const adjustedRange = adjustedMaxValue - adjustedMinValue || 1;
  
  // Chart calculations complete

  // Chart dimensions with proper spacing to prevent overlaps
  const margin = { top: 60, right: 60, left: 60, bottom: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate points with improved Y-axis scaling
  const points = data.map((d, index) => {
    const x = margin.left + (index / (data.length - 1)) * chartWidth;
    const value = d[dataKey] || 0;
    const y = margin.top + chartHeight - ((value - adjustedMinValue) / adjustedRange) * chartHeight;
    return {
      x,
      y,
      value,
      label: d.date || d.name || `Point ${index + 1}`
    };
  });

  // Generate path for line/area
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Y-axis labels with improved scaling
  const yAxisLabels = [];
  for (let i = 0; i <= 5; i++) {
    const value = adjustedMinValue + (adjustedRange * i / 5);
    const y = margin.top + chartHeight - (i / 5) * chartHeight;
    yAxisLabels.push({ value, y });
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {title && (
        <div className="text-center text-lg font-semibold mb-4" style={{ 
          color: themeConfig.foreground
        }}>
          {title}
        </div>
      )}
      
      <svg width={width} height={height} className="w-full h-full">
        <defs>
          {/* Gradient for area charts */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={themeConfig.chartArea} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={themeConfig.chartArea} stopOpacity="0.05"/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <line
            key={index}
            x1={margin.left}
            y1={label.y}
            x2={margin.left + chartWidth}
            y2={label.y}
            stroke={themeConfig.grid}
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <text
            key={index}
            x={margin.left - 10}
            y={label.y + 4}
            textAnchor="end"
            className="text-xs"
            fill={themeConfig.mutedForeground}
          >
            {label.value.toFixed(label.value < 1 ? 2 : 1)}
          </text>
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          index % Math.ceil(points.length / 4) === 0 && (
            <text
              key={index}
              x={point.x}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              className="text-xs"
              fill={themeConfig.mutedForeground}
            >
              {point.label.length > 6 ? point.label.substring(0, 6) + '...' : point.label}
            </text>
          )
        ))}

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
            stroke={themeConfig.chartLine}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {type === 'bar' && points.map((point, index) => {
          const barWidth = chartWidth / points.length * 0.6;
          const barX = point.x - barWidth / 2;
          
          // Calculate bar height and position correctly
          const chartBottom = margin.top + chartHeight;
          const barHeight = chartBottom - point.y;
          const barY = point.y; // Bars start from their value point and extend down to baseline
          
          const dataItem = data[index];
          const barColor = dataItem.color || themeConfig.chartBar;
          
          // Ensure bar never exceeds chart boundaries
          const clampedBarHeight = Math.max(0, Math.min(barHeight, chartHeight));
          const clampedBarY = Math.max(margin.top, Math.min(barY, chartBottom));
          
          return (
            <rect
              key={index}
              x={barX}
              y={clampedBarY}
              width={barWidth}
              height={clampedBarHeight}
              fill={barColor}
              opacity="0.8"
              rx="3"
            />
          );
        })}

        {/* Data points */}
        {(type === 'line' || type === 'area') && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill={themeConfig.chartLine}
            stroke={themeConfig.background}
            strokeWidth="2"
          />
        ))}

        {/* Axes */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke={themeConfig.border}
          strokeWidth="2"
        />
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke={themeConfig.border}
          strokeWidth="2"
        />
        
        {/* Zero line for bar charts */}
        {type === 'bar' && adjustedMinValue <= 0 && adjustedMaxValue >= 0 && (
          <line
            x1={margin.left}
            y1={margin.top + chartHeight - ((0 - adjustedMinValue) / adjustedRange) * chartHeight}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight - ((0 - adjustedMinValue) / adjustedRange) * chartHeight}
            stroke={themeConfig.mutedForeground}
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Data summary */}
      <div className="absolute top-2 right-2 text-xs bg-card border border-border rounded-lg px-3 py-2" style={{ color: themeConfig.mutedForeground }}>
        <div className="font-medium mb-1">Summary</div>
        <div>Max: {maxValue.toFixed(maxValue < 1 ? 3 : 2)}</div>
        <div>Min: {minValue.toFixed(minValue < 1 ? 3 : 2)}</div>
        <div>Range: {range.toFixed(range < 1 ? 3 : 2)}</div>
        <div>Count: {data.length}</div>
      </div>
    </div>
  );
};
