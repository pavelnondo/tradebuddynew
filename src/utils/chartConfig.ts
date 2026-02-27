/**
 * Shared Chart Configuration Utilities
 * 
 * Enforces consistent spacing, margins, and formatting across all charts
 */

import { ThemeConfig } from '../config/themes';

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartAxisConfig {
  stroke: string;
  fontSize: number;
  tickFill: string;
  tickOpacity: number;
  axisLineStroke: string;
  tickLineStroke: string;
}

export interface ChartGridConfig {
  stroke: string;
  strokeOpacity: number;
  strokeDasharray: string;
  horizontalOnly?: boolean; // For line/area charts
}

/**
 * Standard chart margins for proper spacing
 */
export const getChartMargins = (): ChartMargins => ({
  top: 28,      // Space for title/header
  right: 24,    // Tooltip safety area
  bottom: 36,   // X-axis labels
  left: 60,     // Y-axis labels (enough to avoid truncation)
});

/**
 * Get axis configuration based on theme
 */
export const getAxisConfig = (themeConfig: ThemeConfig, fontSize: number = 11): ChartAxisConfig => ({
  stroke: themeConfig.chartText,
  fontSize,
  tickFill: themeConfig.chartText,
  tickOpacity: 0.7,
  axisLineStroke: themeConfig.border,
  tickLineStroke: themeConfig.border,
});

/**
 * Get grid configuration based on theme
 * Horizontal-only for line/area charts, full grid for bar charts
 */
export const getGridConfig = (
  themeConfig: ThemeConfig,
  horizontalOnly: boolean = false
): ChartGridConfig => ({
  stroke: themeConfig.chartGrid,
  strokeOpacity: 1,
  strokeDasharray: '3 3',
  horizontalOnly,
});

/**
 * Format numbers for chart display
 */
export const formatChartValue = (value: number, isCurrency: boolean = false): string => {
  if (isCurrency) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(2)}k`;
    return `$${value.toFixed(2)}`;
  }
  
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}k`;
  if (value % 1 !== 0) return value.toFixed(2);
  return value.toString();
};

/**
 * Format percentage values
 */
export const formatChartPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Get tick count based on chart size
 */
export const getTickCount = (chartHeight: number, isXAxis: boolean = false): number => {
  if (isXAxis) {
    // X-axis: 5-7 ticks
    return chartHeight < 300 ? 5 : 7;
  }
  // Y-axis: 4-6 ticks
  return chartHeight < 300 ? 4 : 6;
};

/**
 * Get tooltip offset to prevent covering data point
 */
export const getTooltipOffset = (): { x: number; y: number } => ({
  x: 12,  // Offset right from cursor
  y: -12, // Offset up from cursor
});
