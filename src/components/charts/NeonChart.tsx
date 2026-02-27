/**
 * Professional Chart Component - Refactored for UX Excellence
 * 
 * Key improvements:
 * - No glow/neon effects (only on hover)
 * - Proper spacing and margins
 * - Professional tooltips
 * - Crosshair for time-series
 * - Hover opacity changes
 * - Reduced grid prominence
 * - Faster, smoother animations
 */

import React, { useState, ReactNode, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  formatChartValue,
  getTickCount,
  getTooltipOffset
} from '../../utils/chartConfig';
import { Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataKey {
  key: string;
  stroke?: string;
  fill?: string;
  name?: string;
  type?: 'monotone' | 'linear';
  strokeWidth?: number;
  dot?: boolean;
  activeDot?: boolean;
  isPrimary?: boolean; // Primary series gets full opacity, others dimmed
}

interface NeonChartProps {
  data: any[];
  chartType: 'line' | 'bar' | 'area' | 'radar' | 'pie';
  dataKeys: DataKey[];
  title?: string;
  isLoading?: boolean;
  error?: any;
  xAxisKey?: string;
  yAxisLabel?: string;
  barColors?: string[];
  lineColors?: string[];
  areaColors?: string[];
  radarColors?: string[];
  pieColors?: string[];
  children?: ReactNode;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  isCurrency?: boolean; // For value formatting
}

export const NeonChart: React.FC<NeonChartProps> = ({
  data,
  chartType,
  dataKeys,
  title,
  isLoading,
  error,
  xAxisKey = 'name',
  yAxisLabel,
  barColors,
  lineColors,
  areaColors,
  radarColors,
  pieColors,
  children,
  height = 400,
  showLegend = true,
  showTooltip = true,
  animated = true,
  isCurrency = false
}) => {
  const { themeConfig } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  // Handle series hover for opacity changes
  const handleMouseEnter = useCallback((dataKey: string) => {
    setHoveredSeries(dataKey);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredSeries(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mr-3" 
             style={{ borderColor: themeConfig.border, borderTopColor: themeConfig.primary }} />
        Loading Chart Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Error loading chart: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available for this chart.
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Invalid data format for chart.
      </div>
    );
  }

  const renderChart = (width: string | number, chartHeight: number) => {
    if (!dataKeys || dataKeys.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data keys provided for chart.
        </div>
      );
    }

    const validDataKeys = dataKeys.filter(dk => dk && dk.key && typeof dk.key === 'string');
    
    if (validDataKeys.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No valid data keys found.
        </div>
      );
    }

    // Get primary series (first one marked as primary, or first one)
    const primarySeries = validDataKeys.find(dk => dk.isPrimary) || validDataKeys[0];
    const primaryKey = primarySeries?.key || '';

    // Chart margins with proper spacing
    const margins = getChartMargins();
    const axisConfig = getAxisConfig(themeConfig, 11);
    const gridConfig = getGridConfig(themeConfig, chartType === 'line' || chartType === 'area');
    const tickCount = getTickCount(chartHeight);
    const tooltipOffset = getTooltipOffset();

    const commonChartProps = {
      data: data,
      margin: margins,
    };

    // Y-axis formatter
    const yAxisFormatter = (value: number) => {
      return formatChartValue(value, isCurrency);
    };

    // X-axis formatter - limit tick count
    const xAxisTickCount = Math.min(tickCount, data.length);

    // Render data series with hover opacity
    const renderDataKeys = () => {
      const elements = [];
      
      for (let index = 0; index < validDataKeys.length; index++) {
        const dk = validDataKeys[index];
        if (!dk || !dk.key) continue;

        const isPrimary = dk.isPrimary || dk.key === primaryKey;
        const isHovered = hoveredSeries === dk.key;
        const shouldDim = hoveredSeries !== null && !isHovered;
        
        // Opacity: hovered = 1.0, primary when nothing hovered = 1.0, dimmed = 0.4
        const opacity = shouldDim ? 0.4 : 1.0;
        
        // Only add subtle glow on hover
        const glowFilter = isHovered ? `drop-shadow(0 0 2px ${dk.stroke || themeConfig.chartLine})` : 'none';

        const stroke = dk.stroke || lineColors?.[index] || themeConfig.chartLine;
        const fill = dk.fill || barColors?.[index] || areaColors?.[index] || radarColors?.[index] || themeConfig.chartBar;
        const strokeWidth = dk.strokeWidth || 2;
        const dot = dk.dot !== undefined ? dk.dot : false; // No dots by default
        const activeDot = dk.activeDot !== undefined ? dk.activeDot : { r: 4 }; // Small active dot

        const key = `${chartType}-${dk.key}-${index}`;

        switch (chartType) {
          case 'line':
            elements.push(
              <Line
                key={key}
                type={dk.type || "monotone"}
                dataKey={dk.key}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                dot={dot}
                activeDot={activeDot}
                name={dk.name || dk.key}
                filter={glowFilter}
                isAnimationActive={animated}
                animationDuration={500}
                onMouseEnter={() => handleMouseEnter(dk.key)}
                onMouseLeave={handleMouseLeave}
              />
            );
            break;
          case 'bar':
            elements.push(
              <Bar
                key={key}
                dataKey={dk.key}
                fill={fill}
                fillOpacity={opacity}
                name={dk.name || dk.key}
                filter={glowFilter}
                isAnimationActive={animated}
                animationDuration={500}
                onMouseEnter={() => handleMouseEnter(dk.key)}
                onMouseLeave={handleMouseLeave}
                radius={[8, 8, 0, 0]}
              />
            );
            break;
          case 'area':
            elements.push(
              <Area
                key={key}
                type={dk.type || "monotone"}
                dataKey={dk.key}
                stroke={stroke}
                fill={fill}
                strokeOpacity={opacity}
                fillOpacity={opacity * 0.2}
                name={dk.name || dk.key}
                strokeWidth={strokeWidth}
                filter={glowFilter}
                isAnimationActive={animated}
                animationDuration={500}
                onMouseEnter={() => handleMouseEnter(dk.key)}
                onMouseLeave={handleMouseLeave}
              />
            );
            break;
          case 'radar':
            elements.push(
              <Radar
                key={key}
                dataKey={dk.key}
                stroke={stroke}
                fill={fill}
                fillOpacity={opacity * 0.6}
                strokeOpacity={opacity}
                name={dk.name || dk.key}
                strokeWidth={strokeWidth}
                filter={glowFilter}
                isAnimationActive={animated}
                animationDuration={500}
                onMouseEnter={() => handleMouseEnter(dk.key)}
                onMouseLeave={handleMouseLeave}
              />
            );
            break;
        }
      }
      
      return elements;
    };

    // Grid component - horizontal only for line/area
    const renderGrid = () => {
      if (gridConfig.horizontalOnly) {
        return (
          <CartesianGrid
            horizontal={true}
            vertical={false}
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
        );
      }
      return (
        <CartesianGrid
          stroke={gridConfig.stroke}
          strokeOpacity={gridConfig.strokeOpacity}
          strokeDasharray={gridConfig.strokeDasharray}
        />
      );
    };

    // Crosshair cursor for line/area charts
    const crosshairCursor = chartType === 'line' || chartType === 'area' 
      ? { stroke: themeConfig.border, strokeWidth: 1, strokeDasharray: '2 2' }
      : { fill: themeConfig.border, fillOpacity: 0.1 };

    return (
      <ResponsiveContainer width={width} height={chartHeight}>
        {chartType === 'line' && (
          <LineChart {...commonChartProps}>
            {renderGrid()}
            <XAxis 
              dataKey={xAxisKey} 
              tickCount={xAxisTickCount}
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
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: axisConfig.tickFill, fontSize: 11 } : undefined}
            />
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />} 
                cursor={crosshairCursor}
                offset={tooltipOffset.x}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />}
            {renderDataKeys()}
            {children}
          </LineChart>
        )}
        {chartType === 'bar' && (
          <BarChart {...commonChartProps}>
            {renderGrid()}
            <XAxis 
              dataKey={xAxisKey} 
              tickCount={xAxisTickCount}
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
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: axisConfig.tickFill, fontSize: 11 } : undefined}
            />
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />} 
                cursor={crosshairCursor}
                offset={tooltipOffset.x}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />}
            {renderDataKeys()}
            {children}
          </BarChart>
        )}
        {chartType === 'area' && (
          <AreaChart {...commonChartProps}>
            {renderGrid()}
            <XAxis 
              dataKey={xAxisKey} 
              tickCount={xAxisTickCount}
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
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: axisConfig.tickFill, fontSize: 11 } : undefined}
            />
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />} 
                cursor={crosshairCursor}
                offset={tooltipOffset.x}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />}
            {renderDataKeys()}
            {children}
          </AreaChart>
        )}
        {chartType === 'radar' && (
          <RadarChart outerRadius={chartHeight < 300 ? 80 : 100} width={width as number} height={chartHeight} data={data}>
            <PolarGrid 
              stroke={gridConfig.stroke} 
              strokeOpacity={gridConfig.strokeOpacity}
            />
            <PolarAngleAxis 
              dataKey={xAxisKey} 
              tick={{ fill: axisConfig.tickFill, fontSize: 10 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 'auto']} 
              tick={{ fill: axisConfig.tickFill, fontSize: 9 }}
            />
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip />}
                offset={tooltipOffset.x}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />}
            {renderDataKeys()}
            {children}
          </RadarChart>
        )}
        {chartType === 'pie' && (
          <PieChart width={width as number} height={chartHeight}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={chartHeight < 300 ? 80 : 100}
              fill="#8884d8"
              dataKey={dataKeys[0]?.key || "value"}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors?.[index] || themeConfig.chartBar} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip valueFormatter={(v) => formatChartValue(Number(v), isCurrency)} />}
                offset={tooltipOffset.x}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />}
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  const renderChartSafely = () => {
    try {
      return renderChart('100%', height);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chart rendering error';
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Chart rendering error:', errorMessage);
      }
      return (
        <div className="flex items-center justify-center h-full text-destructive">
          Chart rendering error. Please check the data format.
        </div>
      );
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Header with title and expand button */}
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-base font-semibold" style={{ color: themeConfig.foreground }}>
            {title}
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-8 w-8 p-0"
          aria-label="Expand chart"
        >
          <Maximize2 className="h-4 w-4" style={{ color: themeConfig.mutedForeground }} />
        </Button>
      </div>
      
      {/* Chart container */}
      <div style={{ height: `${height}px` }}>
        {renderChartSafely()}
      </div>

      {/* Expanded view dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{title || 'Chart'}</DialogTitle>
          </DialogHeader>
          <div style={{ height: '70vh' }}>
            {renderChart('100%', 600)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
