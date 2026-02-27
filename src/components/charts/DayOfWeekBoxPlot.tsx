/**
 * Day-of-Week Box Plot
 * 
 * X-axis: Mon → Fri (or all 7 days)
 * Y-axis: R-multiple or normalized P&L
 * Box shows distribution; dot shows mean
 * Purpose: Distinguish consistent days from volatile or deceptive ones
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { ChartContainer } from './ChartContainer';
import { formatChartValue } from '../../utils/chartConfig';

interface DayOfWeekData {
  day: number;
  dayName: string;
  trades: number[];
  avgR: number;
  medianR: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
}

interface DayOfWeekBoxPlotProps {
  data: DayOfWeekData[];
}

export const DayOfWeekBoxPlot: React.FC<DayOfWeekBoxPlotProps> = ({ data }) => {
  const { themeConfig } = useTheme();

  // Filter to days with trades
  const activeDays = data.filter(d => d.trades.length > 0);
  
  if (activeDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Calculate Y-axis scale
  const allValues = activeDays.flatMap(d => d.trades);
  const yMin = Math.min(...allValues, 0);
  const yMax = Math.max(...allValues, 0);
  const yRange = yMax - yMin;
  const yPadding = yRange * 0.1;

  const chartHeight = 400;
  const padding = { top: 40, right: 40, bottom: 80, left: 80 };
  const chartWidth = activeDays.length * 80 + padding.left + padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  
  const yScale = (value: number) => {
    const normalized = (value - (yMin - yPadding)) / (yRange + yPadding * 2);
    return padding.top + plotHeight - normalized * plotHeight;
  };

  const getY = (value: number) => yScale(value);

  return (
    <ChartContainer minHeight={420} className="w-full">
      <div className="w-full h-full" style={{ minHeight: '420px' }}>
        <svg 
          width="100%" 
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            minHeight: '420px',
            maxHeight: '100%'
          }}
        >
        {/* Y-axis line */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke={themeConfig.border}
          strokeWidth={1}
        />

        {/* Y-axis labels */}
        {[0, yMin, yMax].filter(v => !isNaN(v) && isFinite(v)).map((value, idx) => {
          const y = getY(value);
          return (
            <g key={`y-tick-${idx}`}>
              <line
                x1={padding.left - 5}
                y1={y}
                x2={padding.left}
                y2={y}
                stroke={themeConfig.border}
                strokeWidth={1}
              />
              <text
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                fontSize="10"
                fill={themeConfig.chartText}
                dominantBaseline="middle"
              >
                {value.toFixed(1)}R
              </text>
            </g>
          );
        })}

        {/* Zero line */}
        {yMin < 0 && yMax > 0 && (
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={chartWidth - padding.right}
            y2={getY(0)}
            stroke={themeConfig.border}
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
          />
        )}

        {/* Box plots */}
        {activeDays.map((day, idx) => {
          const x = padding.left + 20 + idx * 80;
          const boxWidth = 50;
          
          // Box (Q1 to Q3)
          const q1Y = getY(day.q1);
          const q3Y = getY(day.q3);
          const boxHeight = Math.abs(q3Y - q1Y);

          // Whiskers (min to max)
          const minY = getY(day.min);
          const maxY = getY(day.max);

          // Median line
          const medianY = getY(day.medianR);

          // Mean dot
          const meanY = getY(day.avgR);

          return (
            <g key={`day-${day.day}`}>
              {/* Whisker lines */}
              <line
                x1={x + boxWidth / 2}
                y1={minY}
                x2={x + boxWidth / 2}
                y2={q1Y}
                stroke={themeConfig.chartText}
                strokeWidth={1}
                opacity={0.6}
              />
              <line
                x1={x + boxWidth / 2}
                y1={q3Y}
                x2={x + boxWidth / 2}
                y2={maxY}
                stroke={themeConfig.chartText}
                strokeWidth={1}
                opacity={0.6}
              />

              {/* Box */}
              <rect
                x={x}
                y={Math.min(q1Y, q3Y)}
                width={boxWidth}
                height={boxHeight}
                fill={themeConfig.chartArea}
                stroke={themeConfig.chartLine}
                strokeWidth={1}
                rx={2}
              />

              {/* Median line */}
              <line
                x1={x}
                y1={medianY}
                x2={x + boxWidth}
                y2={medianY}
                stroke={themeConfig.chartLine}
                strokeWidth={2}
              />

              {/* Mean dot */}
              <circle
                cx={x + boxWidth / 2}
                cy={meanY}
                r={4}
                fill={themeConfig.primary}
                stroke={themeConfig.foreground}
                strokeWidth={1}
              />

              {/* X-axis label */}
              <text
                x={x + boxWidth / 2}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill={themeConfig.chartText}
              >
                {day.dayName}
              </text>

              {/* Tooltip area */}
              <rect
                x={x - 5}
                y={padding.top}
                width={boxWidth + 10}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs" style={{ color: themeConfig.mutedForeground }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border" style={{ borderColor: themeConfig.chartLine, backgroundColor: themeConfig.chartArea }} />
          <span>IQR (Q1-Q3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1" style={{ backgroundColor: themeConfig.chartLine }} />
          <span>Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeConfig.primary }} />
          <span>Mean</span>
        </div>
      </div>
    </ChartContainer>
  );
};
