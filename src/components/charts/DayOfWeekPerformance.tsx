/**
 * Day of Week Performance Chart
 * 
 * Simple bar chart showing wins and losses by day (Monday-Sunday)
 * Shows all days even if there are no trades (zero bars)
 * Similar to Win/Loss Analysis chart
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { ChartContainer } from './ChartContainer';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  getTickCount,
  getTooltipOffset
} from '../../utils/chartConfig';

interface DayOfWeekPerformanceData {
  day: number;
  dayName: string;
  wins: number;
  losses: number;
  tradeCount: number;
}

interface DayOfWeekPerformanceProps {
  data: DayOfWeekPerformanceData[];
}

export const DayOfWeekPerformance: React.FC<DayOfWeekPerformanceProps> = ({ data }) => {
  const { themeConfig } = useTheme();

  // Show all days Monday (1) through Sunday (0) in order
  const allDays = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const chartData = allDays.map((dayNum, idx) => {
    const dayData = data.find(d => d.day === dayNum);
    return {
      day: dayNum,
      dayName: dayNames[idx],
      wins: dayData?.wins || 0,
      losses: dayData?.losses || 0,
      total: (dayData?.wins || 0) + (dayData?.losses || 0)
    };
  }); // Show all days, even with zero trades

  if (chartData.length === 0) {
    return (
      <ChartContainer minHeight={360} className="w-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data available
        </div>
      </ChartContainer>
    );
  }

  const margins = getChartMargins();
  const axisConfig = getAxisConfig(themeConfig, 11);
  const gridConfig = getGridConfig(themeConfig, false);
  const tickCount = getTickCount(360);
  const tooltipOffset = getTooltipOffset();

  return (
    <ChartContainer minHeight={360} className="w-full">
      <div style={{ width: '100%', height: '100%', minHeight: '360px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={360}>
          <BarChart data={chartData} margin={margins}>
            <CartesianGrid
              stroke={gridConfig.stroke}
              strokeOpacity={gridConfig.strokeOpacity}
              strokeDasharray={gridConfig.strokeDasharray}
            />
            <XAxis 
              dataKey="dayName" 
              tickCount={chartData.length}
              tick={axisConfig.tick}
              stroke={axisConfig.axisLineStroke}
              axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
              tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
            />
            <YAxis 
              tickCount={tickCount}
              tick={{ ...axisConfig.tick, fill: axisConfig.tickFill }}
              stroke={axisConfig.axisLineStroke}
              axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
              tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
            />
            <Tooltip 
              content={<ChartTooltip />}
              cursor={{ fill: themeConfig.border, fillOpacity: 0.1 }}
              offset={tooltipOffset.x}
            />
            <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />
            <Bar 
              dataKey="wins" 
              name="Wins"
              fill={themeConfig.success}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={500}
            />
            <Bar 
              dataKey="losses" 
              name="Losses"
              fill={themeConfig.destructive}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
