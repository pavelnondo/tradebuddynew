/**
 * Clean Chart Component - Refactored for Professional UX
 * Minimalist chart with consistent styling
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  formatChartValue,
  getTickCount,
  getTooltipOffset
} from '@/utils/chartConfig';

interface CleanChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'radar';
  dataKey: string;
  title: string;
  xAxisKey?: string;
  customColors?: boolean;
  isCurrency?: boolean;
  height?: number;
}

export const CleanChart: React.FC<CleanChartProps> = ({
  data,
  type,
  dataKey,
  title,
  xAxisKey = 'name',
  customColors = false,
  isCurrency = false,
  height = 400
}) => {
  const { themeConfig } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-card border border-border rounded-lg" style={{ height: `${height}px` }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const margins = getChartMargins();
  const axisConfig = getAxisConfig(themeConfig, 11);
  const gridConfig = getGridConfig(themeConfig, type === 'line' || type === 'area');
  const tickCount = getTickCount(height);
  const tooltipOffset = getTooltipOffset();

  const commonProps = {
    data,
    margin: margins
  };

  const yAxisFormatter = (value: number) => formatChartValue(value, isCurrency);

  const renderChart = () => {
    if (type === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
          <XAxis 
            dataKey={xAxisKey} 
            tickCount={Math.min(tickCount, data.length)}
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
            tickFormatter={yAxisFormatter}
          />
          <Tooltip 
            content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />}
            cursor={{ stroke: themeConfig.border, strokeWidth: 1, strokeDasharray: '2 2' }}
            offset={tooltipOffset.x}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={themeConfig.chartLine}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={true}
            animationDuration={500}
          />
        </LineChart>
      );
    }

    if (type === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
          <XAxis 
            dataKey={xAxisKey} 
            tickCount={Math.min(tickCount, data.length)}
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
            tickFormatter={yAxisFormatter}
          />
          <Tooltip 
            content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />}
            cursor={{ fill: themeConfig.border, fillOpacity: 0.1 }}
            offset={tooltipOffset.x}
          />
          {customColors ? (
            <Bar
              dataKey={dataKey}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || themeConfig.chartBar} />
              ))}
            </Bar>
          ) : (
            <Bar
              dataKey={dataKey}
              fill={themeConfig.chartBar}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={500}
            />
          )}
        </BarChart>
      );
    }

    if (type === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
          <XAxis 
            dataKey={xAxisKey} 
            tickCount={Math.min(tickCount, data.length)}
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
            tickFormatter={yAxisFormatter}
          />
          <Tooltip 
            content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />}
            cursor={{ stroke: themeConfig.border, strokeWidth: 1, strokeDasharray: '2 2' }}
            offset={tooltipOffset.x}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={themeConfig.chartLine}
            fill={themeConfig.chartArea}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={500}
          />
        </AreaChart>
      );
    }

    if (type === 'radar') {
      return (
        <RadarChart data={data} outerRadius={height < 300 ? 80 : 100}>
          <PolarGrid 
            stroke={gridConfig.stroke} 
            strokeOpacity={gridConfig.strokeOpacity}
          />
          <PolarAngleAxis 
            dataKey={xAxisKey} 
            tick={{ fill: axisConfig.tickFill, fontSize: 10 }}
          />
          <PolarRadiusAxis 
            tick={{ fill: axisConfig.tickFill, fontSize: 9 }}
          />
          <Tooltip 
            content={<ChartTooltip />}
            offset={tooltipOffset.x}
          />
          <Radar
            name={title}
            dataKey={dataKey}
            stroke={themeConfig.chartLine}
            fill={themeConfig.chartArea}
            fillOpacity={0.6}
            isAnimationActive={true}
            animationDuration={500}
          />
        </RadarChart>
      );
    }

    return null;
  };

  return (
    <div className="w-full" style={{ minHeight: height, minWidth: 0 }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: themeConfig.foreground }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height} minHeight={Math.max(height, 200)}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
