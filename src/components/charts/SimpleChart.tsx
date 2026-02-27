import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SimpleChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area';
  dataKey: string;
  title: string;
  width?: number;
  height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  type,
  dataKey,
  title,
  width = 400,
  height = 300
}) => {
  const { themeConfig } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card border border-border rounded-lg p-4">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const chartWidth = width - 80; // Leave space for labels
  const chartHeight = height - 80;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  // Get values and calculate scale
  const values = data.map(d => d[dataKey] || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate positions
  const getX = (index: number) => margin.left + (index / (data.length - 1)) * chartWidth;
  const getY = (value: number) => margin.top + chartHeight - ((value - minValue) / range) * chartHeight;

  // Generate Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 5; i++) {
    const value = minValue + (range * i / 5);
    const y = getY(value);
    yAxisLabels.push({ value, y });
  }

  return (
    <div className="w-full h-full bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <g key={index}>
            <line
              x1={margin.left}
              y1={label.y}
              x2={margin.left + chartWidth}
              y2={label.y}
              stroke={themeConfig.border}
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x={margin.left - 10}
              y={label.y + 5}
              textAnchor="end"
              className="text-xs"
              fill={themeConfig.foreground}
            >
              {dataKey === 'balance' || dataKey === 'pnl' ? `$${Math.round(label.value)}` : Math.round(label.value)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((item, index) => (
          <text
            key={index}
            x={getX(index)}
            y={margin.top + chartHeight + 20}
            textAnchor="middle"
            className="text-xs"
            fill={themeConfig.foreground}
          >
            {item.name || item.date || `T${index + 1}`}
          </text>
        ))}

        {/* Chart content */}
        {type === 'line' && (
          <polyline
            points={data.map((item, index) => `${getX(index)},${getY(item[dataKey] || 0)}`).join(' ')}
            fill="none"
            stroke={themeConfig.primary}
            strokeWidth="2"
          />
        )}

        {type === 'bar' && data.map((item, index) => {
          const value = item[dataKey] || 0;
          const barHeight = ((value - minValue) / range) * chartHeight;
          const barY = getY(value);
          
          return (
            <rect
              key={index}
              x={getX(index) - 15}
              y={barY}
              width="30"
              height={barHeight}
              fill={themeConfig.primary}
              opacity="0.8"
            />
          );
        })}

        {type === 'area' && (
          <path
            d={`M ${getX(0)},${getY(data[0][dataKey] || 0)} ${data.map((item, index) => `L ${getX(index)},${getY(item[dataKey] || 0)}`).join(' ')} L ${getX(data.length - 1)},${margin.top + chartHeight} L ${margin.left},${margin.top + chartHeight} Z`}
            fill={themeConfig.primary}
            opacity="0.3"
            stroke={themeConfig.primary}
            strokeWidth="2"
          />
        )}

        {/* Data points */}
        {data.map((item, index) => (
          <circle
            key={index}
            cx={getX(index)}
            cy={getY(item[dataKey] || 0)}
            r="4"
            fill={themeConfig.primary}
            stroke={themeConfig.background}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};