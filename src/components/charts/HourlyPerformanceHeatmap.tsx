/**
 * Hourly Performance Heatmap
 * 
 * X-axis: Hour of day (or session blocks)
 * Color: Avg R or win rate
 * Purpose: Identify optimal and dangerous trading windows
 */

import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { ChartContainer } from './ChartContainer';
import { formatChartValue, formatChartPercent } from '../../utils/chartConfig';

interface HourlyPerformanceData {
  hour: number;
  avgR: number;
  winRate: number;
  tradeCount: number;
  totalPnL: number;
}

interface HourlyPerformanceHeatmapProps {
  data: HourlyPerformanceData[];
  metric?: 'avgR' | 'winRate';
}

export const HourlyPerformanceHeatmap: React.FC<HourlyPerformanceHeatmapProps> = ({
  data,
  metric = 'avgR'
}) => {
  const { themeConfig } = useTheme();

  // Filter to hours with trades
  const activeHours = useMemo(() => {
    return data.filter(d => d.tradeCount > 0);
  }, [data]);

  // Calculate color scale
  const getColor = (value: number, max: number, min: number) => {
    if (max === min) return themeConfig.muted;
    
    const normalized = (value - min) / (max - min);
    
    if (metric === 'winRate') {
      // Green scale for win rate
      const intensity = Math.max(0, Math.min(1, normalized));
      return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
    } else {
      // Blue-green for positive R, red for negative
      if (value >= 0) {
        const intensity = Math.max(0, Math.min(1, normalized / Math.max(Math.abs(max), Math.abs(min))));
        return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
      } else {
        const intensity = Math.max(0, Math.min(1, Math.abs(value) / Math.max(Math.abs(max), Math.abs(min))));
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
      }
    }
  };

  const values = activeHours.map(d => metric === 'avgR' ? d.avgR : d.winRate);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);

  const cellSize = 60;
  const cellGap = 4;
  const padding = { top: 40, right: 20, bottom: 60, left: 100 };
  const width = 24 * (cellSize + cellGap) + padding.left + padding.right;
  const height = cellSize + padding.top + padding.bottom;

  return (
    <ChartContainer minHeight={400} className="w-full">
      <div className="w-full h-full" style={{ minHeight: '400px' }}>
        <svg 
          width="100%" 
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMid meet"
          style={{ 
            minHeight: '400px',
            maxHeight: '100%'
          }}
        >
        {/* X-axis labels (Hours) */}
        {Array.from({ length: 24 }, (_, hour) => {
          const x = 100 + hour * (cellSize + cellGap);
          const hourData = data.find(d => d.hour === hour);
          const value = hourData ? (metric === 'avgR' ? hourData.avgR : hourData.winRate) : 0;
          const color = hourData && hourData.tradeCount > 0 
            ? getColor(value, maxValue, minValue)
            : themeConfig.muted;

          return (
            <g key={`hour-${hour}`}>
              <rect
                x={x}
                y={padding.top}
                width={cellSize}
                height={cellSize}
                fill={color}
                stroke={themeConfig.border}
                strokeWidth={1}
                rx={4}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text
                x={x + cellSize / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="10"
                fill={themeConfig.chartText}
              >
                {hour}
              </text>
              {hourData && hourData.tradeCount > 0 && (
                <>
                  <text
                    x={x + cellSize / 2}
                    y={padding.top + cellSize / 2 - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill={themeConfig.foreground}
                    fontWeight="600"
                  >
                    {hourData.tradeCount}
                  </text>
                  <text
                    x={x + cellSize / 2}
                    y={padding.top + cellSize / 2 + 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill={themeConfig.mutedForeground}
                  >
                    {metric === 'winRate'
                      ? `${hourData.winRate.toFixed(0)}%`
                      : `${hourData.avgR > 0 ? '+' : ''}${hourData.avgR.toFixed(1)}R`
                    }
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs" style={{ color: themeConfig.mutedForeground }}>
        <span>Color intensity: {metric === 'winRate' ? 'Win Rate' : 'Avg R-Multiple'}</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(minValue, maxValue, minValue) }} />
          <span>Low</span>
          <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(maxValue, maxValue, minValue) }} />
          <span>High</span>
        </div>
      </div>
    </ChartContainer>
  );
};
